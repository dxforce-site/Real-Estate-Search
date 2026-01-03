import { LightningElement, api, wire, track } from 'lwc';
import getListingImages from '@salesforce/apex/PropertySearchController.getListingImages';
import basePath from '@salesforce/community/basePath';

export default class ListingPhotoSlider extends LightningElement {
    @api recordId;
    @track imageUrls = [];
    @track currentIndex = 0;

    cmsBaseUrl = basePath + '/sfsites/c/cms/delivery/media/';

    // スワイプ判定用の変数
    startX = 0;
    endX = 0;

    @wire(getListingImages, { listingId: '$recordId' })
    wiredImages({ error, data }) {
        if (data) {
            // data は ImageWrapper オブジェクトの配列になっています
            this.imageUrls = data.map((imgObj, index) => {
                return {
                    url: this.cmsBaseUrl + imgObj.key,
                    caption: imgObj.comment,
                    index: index,
                    active: index === 0,
                    dotClass: index === 0 ? 'dot active' : 'dot',
                    thumbClass: index === 0 ? 'thumbnail active' : 'thumbnail'
                };
            });
            this.currentIndex = 0;
        } else if (error) {
            console.error('Error fetching images:', error);
            this.imageUrls = [];
        }
    }

    get currentImageCaption() {
        if (this.imageUrls.length > 0) {
            return this.imageUrls[this.currentIndex].caption;
        }
        return '';
    }

    get currentImageUrl() {
        if (this.imageUrls.length > 0) {
            return this.imageUrls[this.currentIndex].url;
        }
        return null;
    }

    get hasMultipleImages() {
        return this.imageUrls.length > 1;
    }

    // タッチデバイス用 (スマホ)
    handleTouchStart(event) {
        this.startX = event.changedTouches[0].screenX;
    }

    handleTouchEnd(event) {
        this.endX = event.changedTouches[0].screenX;
        this.handleSwipe();
    }

    // マウスデバイス用 (PC)
    handleMouseDown(event) {
        this.startX = event.screenX;
        // ドラッグ中のカーソル変更などのためにクラスを当てても良い
    }

    handleMouseUp(event) {
        this.endX = event.screenX;
        this.handleSwipe();
    }

    // マウスが画像エリアから外れた場合も判定を行う
    handleMouseLeave(event) {
        // マウスダウンしていなければ無視する制御も可能ですが、
        // 簡易的にはここで判定してもUX上の問題は少ないです
        if (this.startX !== 0) { // 開始地点が記録されている場合のみ
            this.endX = event.screenX;
            this.handleSwipe();
            this.startX = 0; // リセット
        }
    }

    handleSwipe() {
        const threshold = 50; // スワイプとみなす最小距離(px)
        
        // 開始位置と終了位置の差分
        // 右にドラッグ (startX < endX) -> 前の画像へ
        // 左にドラッグ (startX > endX) -> 次の画像へ
        
        if (this.startX - this.endX > threshold) {
            // 左へスワイプ（次の画像）
            this.handleNext();
        } else if (this.endX - this.startX > threshold) {
            // 右へスワイプ（前の画像）
            this.handlePrev();
        }
        
        // 座標リセット
        this.startX = 0;
        this.endX = 0;
    }

    handleNext() {
        this.currentIndex = (this.currentIndex + 1) % this.imageUrls.length;
        this.updateActiveStatus();
    }

    handlePrev() {
        this.currentIndex = (this.currentIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
        this.updateActiveStatus();
    }

    handleDotClick(event) {
        this.currentIndex = parseInt(event.target.dataset.index, 10);
        this.updateActiveStatus();
    }

    updateActiveStatus() {
        this.imageUrls = this.imageUrls.map((img, index) => {
            const isActive = index === this.currentIndex;
            return {
                ...img,
                active: isActive,
                dotClass: isActive ? 'dot active' : 'dot',
                thumbClass: isActive ? 'thumbnail active' : 'thumbnail'
            };
        });
    }
}