import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class PropertySearchResult extends NavigationMixin(LightningElement) {
    @api listings = [];

    // デフォルトは「4-of-12 (3列)」だが、親から上書き可能にする
    @api columnSize = 'slds-size_1-of-1 slds-large-size_4-of-12';

    // クラス結合用のゲッター
    get cardWrapperClass() {
        return `slds-col slds-m-bottom_medium ${this.columnSize}`;
    }

    /**
     * 詳細ページへの遷移
     * standard__recordPage を使用することで、Experience Cloudの標準詳細ページ
     * (URL: /listing/レコードID) に正しくルーティングされます。
     */
    handleNavigate(event) {
        event.preventDefault();
        // ボタンまたはリンクの data-record-id 属性からIDを取得
        const recordId = event.target.dataset.recordId;

        if (recordId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recordId,
                    objectApiName: 'Listing__c', // オブジェクトAPI名
                    actionName: 'view'
                }
            });
        }
    }
}