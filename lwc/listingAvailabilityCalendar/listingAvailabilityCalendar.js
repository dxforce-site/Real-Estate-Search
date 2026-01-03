import { LightningElement, api, track } from 'lwc';
import getWeeklyAvailability from '@salesforce/apex/PropertySearchController.getWeeklyAvailability';
import TourReservationModal from 'c/tourReservationModal';
import LightningAlert from 'lightning/alert';

export default class ListingAvailabilityCalendar extends LightningElement {
    @api recordId;
    
    @track headers = [];
    @track rows = [];
    @track currentStartDate; // Dateオブジェクト

    connectedCallback() {
        // 今日の日付をベースに「今週の月曜日」を計算して初期値にする
        const today = new Date();
        const day = today.getDay(); // 0(Sun) - 6(Sat)
        
        // 月曜始まりにするための調整値
        // 日(0)なら-6日, 月(1)なら0日, 火(2)なら-1日 ... 土(6)なら-5日
        const diff = day === 0 ? -6 : 1 - day; 
        
        today.setDate(today.getDate() + diff);
        today.setHours(0, 0, 0, 0); // 時刻は0にリセット
        
        this.currentStartDate = today;
        this.loadCalendar();
    }

    // 表示用ラベル（例: 2026/1/5 週）
    get currentDateLabel() {
        if (!this.currentStartDate) return '';
        const y = this.currentStartDate.getFullYear();
        const m = this.currentStartDate.getMonth() + 1;
        const d = this.currentStartDate.getDate();
        return `${y}/${m}/${d} 週`;
    }

    // 「今週」より過去には戻れないようにする制御
    get isPrevDisabled() {
        if (!this.currentStartDate) return true;
        
        // 今週の月曜日（基準）を再計算
        const today = new Date();
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const thisMonday = new Date(today);
        thisMonday.setDate(today.getDate() + diff);
        thisMonday.setHours(0, 0, 0, 0);

        // 表示中の開始日が、今週の月曜日以下なら「前へ」は無効
        return this.currentStartDate <= thisMonday;
    }

    async loadCalendar() {
        if (!this.recordId || !this.currentStartDate) return;

        try {
            // YYYY-MM-DD 形式への変換（ゼロ埋め対応）
            const y = this.currentStartDate.getFullYear();
            const m = ('0' + (this.currentStartDate.getMonth() + 1)).slice(-2);
            const d = ('0' + this.currentStartDate.getDate()).slice(-2);
            const dateStr = `${y}-${m}-${d}`; 

            const result = await getWeeklyAvailability({ 
                listingId: this.recordId, 
                startDate: dateStr 
            });

            this.headers = result.headers;
            this.rows = result.rows;

        } catch (error) {
            console.error('Calendar Load Error:', error);
        }
    }

    handlePrevWeek() {
        // 現在の保持している日付から7日引く
        const newDate = new Date(this.currentStartDate);
        newDate.setDate(newDate.getDate() - 7);
        this.currentStartDate = newDate;
        this.loadCalendar();
    }

    handleNextWeek() {
        // 現在の保持している日付に7日足す
        const newDate = new Date(this.currentStartDate);
        newDate.setDate(newDate.getDate() + 7);
        this.currentStartDate = newDate;
        this.loadCalendar();
    }

    async handleSlotClick(event) {
        const selectedTime = event.target.dataset.time;

        const result = await TourReservationModal.open({
            size: 'medium',
            description: '内見予約フォーム',
            listingId: this.recordId,
            initialTime: selectedTime
        });

        if (result && result.status === 'success') {
            await LightningAlert.open({
                message: '内見のお申し込みを受け付けました。',
                theme: 'success',
                label: '予約完了', 
            });
            this.loadCalendar();
        }
    }
}