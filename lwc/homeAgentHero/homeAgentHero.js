import { LightningElement, api, track } from 'lwc';
import invokeAgent from '@salesforce/apex/PropertySearchController.invokeAgent';
import getListingsByIds from '@salesforce/apex/PropertySearchController.getListingsByIds';
import basePath from '@salesforce/community/basePath';

export default class HomeAgentHero extends LightningElement {

    // エクスペリエンスビルダーで設定するAgent API参照名
    @api agentApiName;
    
    @track displayAnswer = '';
    @track recommendedListings = [];
    @track isLoading = false;
    @track hasAnswer = false;

    // 会話のセッションID（文脈維持用）
    sessionId = null;

    cmsBaseUrl = basePath + '/sfsites/c/cms/delivery/media/';

    handleEnter(event) {
        // IME変換中（isComposingがtrue）またはコード229の場合は処理を中断
        if (event.isComposing || event.keyCode === 229) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault(); // デフォルトのSubmit動作などを防ぐ
            const query = event.target.value;
            // 空文字でない場合のみ実行
            if (query && query.trim().length > 0) {
                this.executeAiSearch(query);
            }
        }
    }

    handleSearchClick() {
        // querySelectorでinputの値を取得
        const input = this.template.querySelector('.search-input');
        if (input && input.value) {
            this.executeAiSearch(input.value);
        }
    }
    
    async executeAiSearch(query) {
        if (!this.agentApiName) {
            this.displayAnswer = '設定エラー: Agent API名が設定されていません。';
            this.hasAnswer = true;
            return;
        }

        this.isLoading = true;
        this.hasAnswer = false;
        this.recommendedListings = [];

        try {
            // Apex呼び出し (戻り値は Map<String, Object>)
            const result = await invokeAgent({ 
                userQuery: query,
                agentApiName: this.agentApiName,
                sessionId: this.sessionId
            });
            
            console.log('Agent Result:', JSON.stringify(result));

            // 1. セッションIDの更新
            if (result.sessionId) {
                this.sessionId = result.sessionId;
            }

            // 2. 生の回答テキストを取得
            // 標準アクション 'generateAiAgentResponse' の出力キーは通常 'response' です
            let rawString = '';
            if (result.response) {
                rawString = result.response;
            } else if (result.output) {
                rawString = result.output;
            } else if (result.agentResponse) {
                rawString = result.agentResponse;
            }

            // 3. JSONパースとメッセージ抽出 (ここが重要)
            let finalMessage = rawString; // パース失敗時はそのまま表示

            try {
                const responseObj = JSON.parse(rawString);
                
                // ご提示いただいたログにある "message" キーを優先
                if (responseObj.message) {
                    finalMessage = responseObj.message;
                } 
                // セバスチャン形式 ("value") への対応（念のため）
                else if (responseObj.value) {
                    finalMessage = responseObj.value;
                }
            } catch (e) {
                // JSONではない、またはパースエラーの場合は生の文字列をそのまま使う
                console.log('Response is not JSON or parsing failed, using raw string.');
            }

            // 4. テキスト解析（ID抽出 & マークダウン変換）
            // finalMessage (中身のテキスト) を渡す
            const { cleanText, ids } = this.parseAgentResponse(finalMessage);
            this.displayAnswer = cleanText;

            // 5. 物件情報の取得
            if (ids.length > 0) {
                const listings = await getListingsByIds({ listingIds: ids });
                
                this.recommendedListings = listings.map(record => {
                    let listingKey = null;
                    if (record.ListingPhotos__r && record.ListingPhotos__r.length > 0) {
                        listingKey = record.ListingPhotos__r[0].ImageContentsKey__c;
                    }
                    const listingPhotoUrl = listingKey ? (this.cmsBaseUrl + listingKey) : null;
                    
                    let buildingKey = null;
                    if (record.Building__r && record.Building__r.ExteriorImageContentsKey__c) {
                        buildingKey = record.Building__r.ExteriorImageContentsKey__c;
                    }
                    const buildingPhotoUrl = buildingKey ? (this.cmsBaseUrl + buildingKey) : null;

                    return {
                        ...record,
                        listingPhotoUrl: listingPhotoUrl,
                        buildingPhotoUrl: buildingPhotoUrl,
                        buildingName: record.Building__r ? record.Building__r.Name : '',
                        nearestStation: record.Building__r ? record.Building__r.NearestStation__c : '',
                        walkMinutes: record.Building__r ? record.Building__r.WalkMinutes__c : null
                    };
                });
            }

            this.hasAnswer = true;

        } catch (error) {
            console.error('AI Search Error:', error);
            const errorMsg = error.body ? error.body.message : 'エラーが発生しました。';
            this.displayAnswer = '申し訳ありません。' + errorMsg;
            this.hasAnswer = true;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Agentの回答を解析し、ID抽出とマークダウン→HTML変換を行う
     */
    parseAgentResponse(rawText) {
        const idRegex = /\[ID:\s*([a-zA-Z0-9]{15,18})\]/g;
        const ids = [];
        
        let match;
        while ((match = idRegex.exec(rawText)) !== null) {
            ids.push(match[1]); 
        }

        // 1. IDタグの削除
        let formattedText = rawText.replace(idRegex, '').trim();

        // 2. 簡易マークダウン変換 (HTML化)

        // (A) 見出しの変換
        // パターン1: Markdown形式 "### Title"
        formattedText = formattedText.replace(/(?:^|\n)[ \t]*### (.*?)[ \t]*(?:\n+|$)/g, '<h3 style="font-size:1.1rem; font-weight:bold; margin-top:1.5em; margin-bottom:0.5em;">$1</h3>');
        
        // パターン2: 番号付きリスト形式 "1. Title" 
        // 行頭または改行後に「数字. 空白」で始まる行を、見出し(h3)に変換します
        formattedText = formattedText.replace(/(?:^|\n)[ \t]*\d+\.\s+(.*?)[ \t]*(?:\n+|$)/g, '<h3 style="font-size:1.1rem; font-weight:bold; margin-top:1.5em; margin-bottom:0.5em;">$1</h3>');

        // (B) リストの変換
        // "- Item" または "• Item" を "・Item" に統一
        formattedText = formattedText.replace(/(^|\n|>) ?[-•] (.*?)$/gm, '$1・$2');

        // (C) 太字の変換
        // パターン1: Markdown形式 "**Text**"
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        // パターン2: キーバリュー形式 "・項目名: 値"
        // リストの中黒(・)の後ろにあり、コロン(: または ：)で終わる部分を太字にします
        formattedText = formattedText.replace(/・(.*?)([:：])/g, '・<b>$1</b>$2');

        // (D) 改行の変換
        formattedText = formattedText.replace(/\n/g, '<br>');
    
        return { cleanText: formattedText, ids };
    }
}