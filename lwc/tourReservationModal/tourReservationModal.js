import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import submitReservation from '@salesforce/apex/PropertySearchController.submitReservation';
import LightningAlert from 'lightning/alert';

export default class TourReservationModal extends LightningModal {
    @api listingId;
    @api initialTime;

    @track form = {
        name: '',
        email: '',
        phone: '',
        preferredTime: '',
        remarks: ''
    };

    @track isSubmitting = false;

    connectedCallback() {
        if (this.initialTime) {
            this.form.preferredTime = this.initialTime;
        }
    }

    handleChange(event) {
        const field = event.target.dataset.field;
        this.form[field] = event.target.value;
    }

    handleCancel() {
        this.close('cancelled');
    }

    async handleSubmit() {
        const allValid = [...this.template.querySelectorAll('lightning-input, lightning-textarea')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);

        if (!allValid) {
            return;
        }

        this.isSubmitting = true;

        try {
            await submitReservation({ 
                reservationData: {
                    ...this.form,
                    listingId: this.listingId
                }
            });

            // ここではアラートを出さず、親に成功ステータスを返して閉じる
            // (モーダルが閉じる瞬間のアラート消失を防ぐため)
            this.close({ status: 'success' });

        } catch (error) {
            console.error('Reservation Error:', error);
            // エラー時はモーダルが閉じないので、ここでアラートを出してOK
            await LightningAlert.open({
                message: error.body ? error.body.message : '予約の送信に失敗しました。',
                theme: 'error',
                label: '予約の送信に失敗しました。',
            });
        } finally {
            this.isSubmitting = false;
        }
    }
}