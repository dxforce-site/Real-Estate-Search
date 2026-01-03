import { LightningElement, track } from 'lwc';
import getAgentWeeklySchedule from '@salesforce/apex/PropertySearchController.getAgentWeeklySchedule';
import { NavigationMixin } from 'lightning/navigation';

export default class AgentScheduleCalendar extends NavigationMixin(LightningElement) {
    @track headers = [];
    @track rows = [];
    @track currentStartDate;

    connectedCallback() {
        // 初期表示を「今週の月曜日」に設定
        const today = new Date();
        const day = today.getDay(); 
        const diff = day === 0 ? -6 : 1 - day; // 月曜始まり
        today.setDate(today.getDate() + diff);
        today.setHours(0, 0, 0, 0);
        
        this.currentStartDate = today;
        this.loadCalendar();
    }

    get currentDateLabel() {
        if (!this.currentStartDate) return '';
        return this.currentStartDate.toLocaleDateString() + ' 週';
    }

    async loadCalendar() {
        if (!this.currentStartDate) return;

        try {
            const y = this.currentStartDate.getFullYear();
            const m = ('0' + (this.currentStartDate.getMonth() + 1)).slice(-2);
            const d = ('0' + this.currentStartDate.getDate()).slice(-2);
            const dateStr = `${y}-${m}-${d}`;

            const result = await getAgentWeeklySchedule({ startDate: dateStr });

            this.headers = result.headers;
            this.rows = result.rows;

        } catch (error) {
            console.error('Calendar Load Error:', error);
        }
    }

    handlePrevWeek() {
        const newDate = new Date(this.currentStartDate);
        newDate.setDate(newDate.getDate() - 7);
        this.currentStartDate = newDate;
        this.loadCalendar();
    }

    handleNextWeek() {
        const newDate = new Date(this.currentStartDate);
        newDate.setDate(newDate.getDate() + 7);
        this.currentStartDate = newDate;
        this.loadCalendar();
    }

    // 予定クリックで詳細ページへ
    handleEventClick(event) {
        const recordId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'ViewingRequest__c',
                actionName: 'view'
            }
        });
    }
}