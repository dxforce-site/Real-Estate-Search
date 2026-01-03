こちらは、B2B不動産ポータルを実装するためのサンプルコードを格納したリポジトリです。<br>
以下のフォルダ構成を参考にデプロイしてください。<br>
※メタデータに不足があれば https://dxforce.site に問い合わせを下さい。<br>

### オブジェクト
- objects
- tabs
- globalValueSets
- sharingSets

### LWC
- lwc
- classes

### Agentforce
- genAiPlannerBundles
- genAiPromptTemplates

### Data 360
- dataStreamTemplates
- dataSrcDataModelFieldMaps
- dataSourceObjects
- dataSourceBundleDefinitions
- mktDataSources
- DataPackageKitObjects
- dataPackageKitDefinitions
- dataKitObjectTemplates
- dataKitObjectDependencies
- objects/IntegratedListingSearch__dlm

#### DevOps Datakit package.xml
```
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>IntegratedListingSearch__dlm.Address__c</members>
        <members>IntegratedListingSearch__dlm.Area_Size__c</members>
        <members>IntegratedListingSearch__dlm.Building_Description_AI__c</members>
        <members>IntegratedListingSearch__dlm.Building_ID__c</members>
        <members>IntegratedListingSearch__dlm.Building_Name__c</members>
        <members>IntegratedListingSearch__dlm.Building__c</members>
        <members>IntegratedListingSearch__dlm.Built_Year__c</members>
        <members>IntegratedListingSearch__dlm.Combined_Search_Text__c</members>
        <members>IntegratedListingSearch__dlm.DataSourceObject__c</members>
        <members>IntegratedListingSearch__dlm.DataSource__c</members>
        <members>IntegratedListingSearch__dlm.Floor_Plan__c</members>
        <members>IntegratedListingSearch__dlm.InternalOrganization__c</members>
        <members>IntegratedListingSearch__dlm.Listing_Id__c</members>
        <members>IntegratedListingSearch__dlm.Nearest_Station__c</members>
        <members>IntegratedListingSearch__dlm.Rent__c</members>
        <members>IntegratedListingSearch__dlm.Room_Count__c</members>
        <members>IntegratedListingSearch__dlm.Room_Number__c</members>
        <members>IntegratedListingSearch__dlm.SalesPoint_AI__c</members>
        <members>IntegratedListingSearch__dlm.Status__c</members>
        <members>IntegratedListingSearch__dlm.Walk_Minutes__c</members>
        <members>IntegratedListingSearch__dlm.cdp_sys_record_currency__c</members>
        <name>CustomField</name>
    </types>
    <types>
        <members>IntegratedListingSearch__dlm</members>
        <name>CustomObject</name>
    </types>
    <types>
        <members>Building_c_Home</members>
        <members>FeatureMaster_c_Home</members>
        <members>ListingFeature_c_Home</members>
        <members>Listing_c_Home</members>
        <members>SalesforceDotCom_Home</members>
        <members>SalesforceDotCom_Home1</members>
        <members>SalesforceDotCom_Home2</members>
        <members>SalesforceDotCom_Home3</members>
        <members>UnifiedListing_Gen_DLO</members>
        <members>UnifiedListing_Gen_DLO1</members>
        <name>DataKitObjectDependency</name>
    </types>
    <types>
        <members>Building_c_Home</members>
        <members>Definition</members>
        <members>FeatureMaster_c_Home</members>
        <members>ListingFeature_c_Home</members>
        <members>Listing_Retriever_1Cx_5Olaa10b5a9</members>
        <members>Listing_c_Home</members>
        <members>SalesforceDotCom_Home</members>
        <members>UnifiedListing_Gen_DLO</members>
        <members>UnifiedListing_Gen_DLO1</members>
        <name>DataKitObjectTemplate</name>
    </types>
    <types>
        <members>DXforce</members>
        <name>DataPackageKitDefinition</name>
    </types>
    <types>
        <members>DXforce_1767439056167</members>
        <members>DXforce_1767439073618</members>
        <members>DXforce_1767439073759</members>
        <members>DXforce_1767439176923</members>
        <members>DXforce_1767439178132</members>
        <members>DXforce_1767439178429</members>
        <members>DXforce_1767439179483</members>
        <members>DXforce_1767439181094</members>
        <members>DXforce_1767439182685</members>
        <members>DXforce_1767439230312</members>
        <members>DXforce_1767439230547</members>
        <members>DXforce_1767439273743</members>
        <name>DataPackageKitObject</name>
    </types>
    <types>
        <members>Salesforce_Home</members>
        <members>UnifiedListing_Gen_DLO</members>
        <name>DataSource</name>
    </types>
    <types>
        <members>Real_Estate_Search</members>
        <name>DataSourceBundleDefinition</name>
    </types>
    <types>
        <members>Building_c_Home1</members>
        <members>FeatureMaster_c_Home1</members>
        <members>ListingFeature_c_Home1</members>
        <members>Listing_c_Home1</members>
        <members>UnifiedListing_Gen_DLO</members>
        <name>DataSourceObject</name>
    </types>
    <types>
        <members>DXforceUnifiedListing_Gen_DLOAddressIntegratedListingSearchAddressUVhOXuUcHlzSPFj</members>
        <members>DXforceUnifiedListing_Gen_DLOArea_SizeIntegratedListingSearchArea_SizemkhoxqVvaBRswck</members>
        <members>DXforceUnifiedListing_Gen_DLOBuildingIntegratedListingSearchBuildingTcepNVpegUzSYxB</members>
        <members>DXforceUnifiedListing_Gen_DLOBuilding_Description_AIIntegratedListingSearchBuilding_Description_AIdZFYQOQyfLHcgwy</members>
        <members>DXforceUnifiedListing_Gen_DLOBuilding_IdIntegratedListingSearchBuilding_IDLuhnQYkgTVwfdDJ</members>
        <members>DXforceUnifiedListing_Gen_DLOBuilding_NameIntegratedListingSearchBuilding_NameszNpgvIVUkRaCmU</members>
        <members>DXforceUnifiedListing_Gen_DLOBuilt_YearIntegratedListingSearchBuilt_YearABlqSPPNiuchCuV</members>
        <members>DXforceUnifiedListing_Gen_DLOCombined_Search_TextIntegratedListingSearchCombined_Search_TextUHkNuQzxOsnjctO</members>
        <members>DXforceUnifiedListing_Gen_DLODataSourceIntegratedListingSearchDataSourceiTMzquDWnlpujsa</members>
        <members>DXforceUnifiedListing_Gen_DLODataSourceObjectIntegratedListingSearchDataSourceObjectESoWzkCQEjnOrdP</members>
        <members>DXforceUnifiedListing_Gen_DLOFloor_PlanIntegratedListingSearchFloor_PlandTZacJQCgdlpvAV</members>
        <members>DXforceUnifiedListing_Gen_DLOInternalOrganizationIntegratedListingSearchInternalOrganizationGfApjmmquCjLPNe</members>
        <members>DXforceUnifiedListing_Gen_DLOListing_IdIntegratedListingSearchListing_IdDSMOoHzFTduBUQf</members>
        <members>DXforceUnifiedListing_Gen_DLONearest_StationIntegratedListingSearchNearest_StationETLBspWQEaOexAp</members>
        <members>DXforceUnifiedListing_Gen_DLORentIntegratedListingSearchRentjhKBQwmQnBqRwbo</members>
        <members>DXforceUnifiedListing_Gen_DLORoom_CountIntegratedListingSearchRoom_CountSwUskSjkLWOtVNJ</members>
        <members>DXforceUnifiedListing_Gen_DLORoom_NumberIntegratedListingSearchRoom_NumberHRcrqgRwsgGWEDt</members>
        <members>DXforceUnifiedListing_Gen_DLOSalesPoint_AIIntegratedListingSearchSalesPoint_AIDclhdBfIffeaAOJ</members>
        <members>DXforceUnifiedListing_Gen_DLOStatusIntegratedListingSearchStatusdFegZbLCNuNpfqw</members>
        <members>DXforceUnifiedListing_Gen_DLOWalk_MinutesIntegratedListingSearchWalk_MinutesstWLpybttxJmmbZ</members>
        <members>DXforceUnifiedListing_Gen_DLOcdp_sys_record_currencyIntegratedListingSearchcdp_sys_record_currencyIxGRuiXpVQqIJnA</members>
        <name>DataSrcDataModelFieldMap</name>
    </types>
    <types>
        <members>Building_c_Home_1767439182706</members>
        <members>FeatureMaster_c_Home_1767439178153</members>
        <members>ListingFeature_c_Home_1767439179505</members>
        <members>Listing_c_Home_1767439181119</members>
        <name>DataStreamTemplate</name>
    </types>
    <version>65.0</version>
</Package>

```
