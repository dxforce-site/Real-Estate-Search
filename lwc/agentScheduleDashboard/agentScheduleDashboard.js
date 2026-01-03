import { LightningElement, wire, track } from 'lwc';
import getMyUpcomingReservations from '@salesforce/apex/PropertySearchController.getMyUpcomingReservations';
import cancelReservation from '@salesforce/apex/PropertySearchController.cancelReservation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';


import LightningConfirm from 'lightning/confirm';

export default class AgentScheduleDashboard extends NavigationMixin(LightningElement) {
    @track tableData = [];
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


    // キャンセル処理
    async handleCancel(recordId) {
        // 確認ダイアログ（LightningConfirm）
        const result = await LightningConfirm.open({
            message: 'この予約をキャンセルしてもよろしいですか？',
            variant: 'headerless',
            label: '予約キャンセルの確認',
        });

        if (!result) {
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