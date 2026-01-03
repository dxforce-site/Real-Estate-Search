import { LightningElement, wire, track } from 'lwc';
import getMyUpcomingReservations from '@salesforce/apex/PropertySearchController.getMyUpcomingReservations';
import cancelReservation from '@salesforce/apex/PropertySearchController.cancelReservation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

// データテーブルの列定義
const COLUMNS = [
    // 1. 日時: 固定 (150px)
    { 
        label: '日時', 
        fieldName: 'PreferredTime__c', 
        type: 'date', 
        typeAttributes: { 
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
        },
        initialWidth: 150, 
        sortable: true 
    },
    // 2. お客様名: 固定 (120px) - 列が増えたので少し詰め気味に固定します
    { 
        label: 'お客様名', 
        fieldName: 'Name__c', 
        type: 'text', 
        initialWidth: 120,
        wrapText: true 
    },
    // 3. 電話: 固定 (135px)
    { 
        label: '電話', 
        fieldName: 'Phone__c', 
        type: 'text', 
        initialWidth: 135 
    },
    // 4. メール: 固定 (50px) - アイコンのみ表示等は難しいので、幅を狭めて省略表示させるか、広めに取るか
    // ここではクリックしやすいようある程度確保しますが、長すぎる場合は省略されます
    { 
        label: 'メール', 
        fieldName: 'Email__c', 
        type: 'email', 
        initialWidth: 160
    },
    // 5. 建物名: 可変幅 (自動)
    { 
        label: '建物名', 
        fieldName: 'BuildingName__c', 
        type: 'text', 
        wrapText: true 
    },
    // 6. 住戸名: 固定 (65px)
    { 
        label: '住戸名', 
        fieldName: 'ListingName', 
        type: 'button', 
        typeAttributes: { 
            label: { fieldName: 'ListingName' }, 
            name: 'view_listing', 
            variant: 'base' 
        },
        initialWidth: 65 
    },
    // 7. 備考: 可変幅 (自動) - ★ここに追加
    { 
        label: '備考・要望', 
        fieldName: 'Remarks__c', 
        type: 'text', 
        wrapText: true 
    },
    // 8. ステータス: 固定 (120px)
    { 
        label: 'ステータス', 
        fieldName: 'Status__c', 
        type: 'text', 
        initialWidth: 120 
    },
    // 9. アクション: 固定 (60px)
    {
        type: 'action',
        typeAttributes: { rowActions: [
            { label: 'キャンセル', name: 'cancel' }
        ] },
        initialWidth: 60 
    }
];

export default class AgentScheduleDashboard extends NavigationMixin(LightningElement) {
    @track tableData = [];
    columns = COLUMNS;
    wiredResult; // refreshApex用

    @wire(getMyUpcomingReservations)
    wiredReservations(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            // データ加工: 関連オブジェクトの項目をフラットにする
            this.tableData = data.map(row => {
                return {
                    ...row,
                    ListingName: row.TargetListing__r ? row.TargetListing__r.Name : '不明な物件',
                    // キャンセル済みの行にスタイルを当てるためのクラス（datatableでは難しいので今回はデータのみ）
                };
            });
        } else if (error) {
            console.error('Data Load Error:', error);
            this.tableData = [];
        }
    }

    get hasData() {
        return this.tableData && this.tableData.length > 0;
    }

    // データ更新
    refreshData() {
        return refreshApex(this.wiredResult);
    }

    // 行アクション（キャンセル または 物件名クリック）
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'cancel':
                this.handleCancel(row.Id);
                break;
            case 'view_listing':
                this.navigateToListing(row.TargetListing__c);
                break;
            default:
        }
    }

    // キャンセル処理
    async handleCancel(recordId) {
        // 確認ダイアログ（簡易版）
        if (!confirm('この予約をキャンセルしてもよろしいですか？')) {
            return;
        }

        try {
            await cancelReservation({ reservationId: recordId });
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'キャンセル完了',
                    message: '予約ステータスをキャンセルに変更しました。',
                    variant: 'success'
                })
            );
            // リストを更新
            this.refreshData();

        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'エラー',
                    message: 'キャンセル処理に失敗しました',
                    variant: 'error'
                })
            );
        }
    }

    // 物件詳細へ遷移
    navigateToListing(listingId) {
        if (listingId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: listingId,
                    objectApiName: 'Listing__c', // オブジェクトAPI名
                    actionName: 'view'
                }
            });
        }
    }
    // モバイル用：キャンセルボタンクリック
    handleMobileCancel(event) {
        const recordId = event.target.dataset.id;
        this.handleCancel(recordId);
    }

    // モバイル用：物件リンククリック
    handleMobileNavigate(event) {
        event.preventDefault();
        const listingId = event.currentTarget.dataset.id;
        this.navigateToListing(listingId);
    }
}