import { LightningElement, wire, track } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import getFeatureMasters from '@salesforce/apex/PropertySearchController.getFeatureMasters';

import LISTING_OBJECT from '@salesforce/schema/Listing__c';
import FLOOR_PLAN_FIELD from '@salesforce/schema/Listing__c.FloorPlan__c';

export default class PropertySearchFilter extends LightningElement {
    
    selectedFeatures = [];
    floorPlanOptions = [];
    
    // カテゴリごとに整理された設備リストを格納
    @track groupedFeatures = [];

    @wire(getObjectInfo, { objectApiName: LISTING_OBJECT })
    listingObjectInfo;

    @wire(getPicklistValues, { 
        recordTypeId: '$listingObjectInfo.data.defaultRecordTypeId', 
        fieldApiName: FLOOR_PLAN_FIELD 
    })
    wiredFloorPlanValues({ error, data }) {
        if (data) {
            this.floorPlanOptions = data.values.map(plValue => ({ label: plValue.label, value: plValue.value }));
        }
    }

    // Apexから設備マスタを取得し、カテゴリごとにグルーピングする
    @wire(getFeatureMasters)
    wiredFeatures({ error, data }) {
        if (data) {
            this.groupFeaturesByCategory(data);
        } else if (error) {
            console.error('Error fetching features', error);
        }
    }

    /**
     * フラットな設備リストをカテゴリごとにグループ化する処理
     * 目標構造:
     * [
     * { categoryName: 'セキュリティ', features: [ {Name: 'オートロック'...}, ... ] },
     * { categoryName: 'キッチン', features: [...] }
     * ]
     */
    groupFeaturesByCategory(featureList) {
        const categoryMap = {};

        featureList.forEach(feature => {
            // カテゴリがない場合は「その他」などに割り当てるか、そのまま表示
            const category = feature.Category__c || 'その他';
            
            if (!categoryMap[category]) {
                categoryMap[category] = [];
            }
            categoryMap[category].push(feature);
        });

        // オブジェクトを配列に変換（Category__cの選択リスト順序を考慮する場合は別途ソートロジックが必要）
        // ここでは単純にカテゴリ名の文字列順または登場順になります
        this.groupedFeatures = Object.keys(categoryMap).map(catName => {
            return {
                categoryName: catName,
                features: categoryMap[catName]
            };
        });
    }

    handleFeatureChange(event) {
        const featureId = event.target.value;
        if (event.target.checked) {
            this.selectedFeatures.push(featureId);
        } else {
            this.selectedFeatures = this.selectedFeatures.filter(id => id !== featureId);
        }
    }

    notifySearch() {
        const inputs = this.template.querySelectorAll('lightning-input, lightning-combobox');
        const conditions = {};

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            if (name) {
                conditions[name] = input.value ? input.value : null; 
            }
        });

        conditions.featureIds = this.selectedFeatures;

        const searchEvent = new CustomEvent('search', {
            detail: conditions
        });
        this.dispatchEvent(searchEvent);
    }
}