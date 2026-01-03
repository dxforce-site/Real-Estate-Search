import { LightningElement, track, wire } from 'lwc';
import searchListings from '@salesforce/apex/PropertySearchController.searchListings';
import basePath from '@salesforce/community/basePath';

export default class PropertySearchContainer extends LightningElement {
    
    @track processedListings = [];
    @track isLoading = false;
    searchConditions = {};

    // CMS画像のベースURL
    cmsBaseUrl = basePath + '/sfsites/c/cms/delivery/media/';

    connectedCallback() {
        this.executeSearch();
    }

    handleSearch(event) {
        this.searchConditions = event.detail;
        this.executeSearch();
    }

    executeSearch() {
        this.isLoading = true;

        searchListings({
            city: this.searchConditions.city,
            minRent: this.searchConditions.minRent,
            maxRent: this.searchConditions.maxRent,
            featureIds: this.searchConditions.featureIds,
            floorPlan: this.searchConditions.floorPlan,
            minArea: this.searchConditions.minArea,
            maxArea: this.searchConditions.maxArea,
            minWalk: this.searchConditions.minWalk,
            maxWalk: this.searchConditions.maxWalk,
            station: this.searchConditions.station,
            maxAge: this.searchConditions.maxAge
        })
        .then(result => {
            // データ加工
            this.processedListings = result.map(record => {
                
                // 住戸写真（ListingPhotos__r[0]）のURL生成
                let listingKey = null;
                if (record.ListingPhotos__r && record.ListingPhotos__r.length > 0) {
                    listingKey = record.ListingPhotos__r[0].ImageContentsKey__c;
                }
                const listingPhotoUrl = listingKey ? (this.cmsBaseUrl + listingKey) : null;

                // 建物外観（Building__r.Exterior...）のURL生成
                let buildingKey = null;
                if (record.Building__r && record.Building__r.ExteriorImageContentsKey__c) {
                    buildingKey = record.Building__r.ExteriorImageContentsKey__c;
                }
                const buildingPhotoUrl = buildingKey ? (this.cmsBaseUrl + buildingKey) : null;

                return {
                    ...record,
                    listingPhotoUrl: listingPhotoUrl,   // 住戸写真
                    buildingPhotoUrl: buildingPhotoUrl, // 外観写真
                    buildingName: record.Building__r ? record.Building__r.Name : '',
                    nearestStation: record.Building__r ? record.Building__r.NearestStation__c : '',
                    walkMinutes: record.Building__r ? record.Building__r.WalkMinutes__c : null
                };
            });
            this.isLoading = false;
        })
        .catch(error => {
            console.error('Search Error:', error);
            this.processedListings = [];
            this.isLoading = false;
        });
    }

    get isNoResults() {
        return !this.isLoading && this.processedListings.length === 0;
    }
}