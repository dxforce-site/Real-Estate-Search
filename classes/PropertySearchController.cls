/**
 * @description 不動産ポータルサイトの物件検索機能を提供するコントローラークラス。
 */
public with sharing class PropertySearchController {

    /**
     * @description 検索フィルターで使用する「設備マスタ」のリストを取得します。
     */
    @AuraEnabled(cacheable=true)
    public static List<FeatureMaster__c> getFeatureMasters() {
        return [
            SELECT Id, Name, IconName__c 
            FROM FeatureMaster__c 
            ORDER BY Name 
        ];
    }

    /**
     * @description ユーザーが指定した条件に基づいて募集住戸（Listing__c）を検索します。
     * @param city          エリア（市区町村）。
     * @param minRent       下限賃料。
     * @param maxRent       上限賃料。
     * @param featureIds    選択された設備IDリスト。
     * @param floorPlan     間取り（例：'1K', '2LDK'）。完全一致。
     * @param minArea       下限専有面積（㎡）。
     * @param maxArea       上限専有面積（㎡）。
     * @param minWalk       下限徒歩分数（分）。
     * @param maxWalk       上限徒歩分数（分）。
     * @param station       最寄駅名（あいまい検索）。
     * @param maxAge        築年数上限（例：10 -> 築10年以内）。
     * * @return List<Listing__c> 検索条件に一致した募集住戸のリスト。
     */
    @AuraEnabled(cacheable=true)
    public static List<Listing__c> searchListings(
        String city, 
        Decimal minRent, 
        Decimal maxRent, 
        List<String> featureIds,
        String floorPlan,
        Decimal minArea,
        Decimal maxArea,
        Decimal minWalk,
        Decimal maxWalk,
        String station,
        Integer maxAge
    ) {
        // ベースクエリ
        String query = 'SELECT Id, Name, Rent__c, Status__c, FloorPlan__c, AreaSize__c, Search_Address__c, SalesPoint_AI__c, ' +
                       '       Building__r.Name, Building__r.ExteriorImageContentsKey__c, Building__r.WalkMinutes__c, ' +
                       '       Building__r.NearestStation__c, Building__r.BuiltYear__c, Building__r.BuildingDescription_AI__c, ' +
                       '       (SELECT Id, ImageContentsKey__c FROM ListingPhotos__r ORDER BY SortOrder__c ASC LIMIT 1) ' +
                       'FROM Listing__c ' +
                       'WHERE Status__c = \'募集中\' '; 

        // --- 動的SOQLによる条件追加 ---

        // バインド変数の準備
        String citySearchTerm;
        String stationSearchTerm;
        Integer targetBuiltYear;

        // 1. エリア（City）検索：あいまい検索
        if (String.isNotBlank(city)) {
            citySearchTerm = '%' + city + '%';
            query += ' AND Search_Address__c LIKE :citySearchTerm';
        }

        // 2. 賃料（Rent）
        if (minRent != null) {
            query += ' AND Rent__c >= :minRent';
        }
        if (maxRent != null) {
            query += ' AND Rent__c <= :maxRent';
        }

        // 3. 設備（Feature）：AND条件
        if (featureIds != null && !featureIds.isEmpty()) {
            for (String fId : featureIds) {
                query += ' AND Id IN (SELECT Listing__c FROM ListingFeature__c WHERE Feature__c = \'' + String.escapeSingleQuotes(fId) + '\')';
            }
        }

        // 4. 間取り（FloorPlan）：完全一致
        if (String.isNotBlank(floorPlan)) {
            query += ' AND FloorPlan__c = :floorPlan';
        }

        // 5. 専有面積（AreaSize）
        if (minArea != null) {
            query += ' AND AreaSize__c >= :minArea';
        }
        if (maxArea != null) {
            query += ' AND AreaSize__c <= :maxArea';
        }

        // 6. 徒歩分数（WalkMinutes）：親オブジェクト参照
        if (minWalk != null) {
            query += ' AND Building__r.WalkMinutes__c >= :minWalk';
        }
        if (maxWalk != null) {
            query += ' AND Building__r.WalkMinutes__c <= :maxWalk';
        }

        // 7. 最寄駅（NearestStation）：親オブジェクト参照・あいまい検索
        if (String.isNotBlank(station)) {
            stationSearchTerm = '%' + station + '%';
            query += ' AND Building__r.NearestStation__c LIKE :stationSearchTerm';
        }

        // 8. 築年数（BuiltYear）：計算ロジック
        // 例：maxAge=10（築10年以内）の場合、現在は2025年なら 2015年以降に建てられたものを探す
        if (maxAge != null) {
            targetBuiltYear = Date.today().year() - maxAge;
            query += ' AND Building__r.BuiltYear__c >= :targetBuiltYear';
        }

        // 並び替え
        query += ' ORDER BY CreatedDate DESC LIMIT 50';

        return Database.query(query);
    }

    // 画像情報とコメントをセットで返すためのラッパークラス
    public class ImageWrapper {
        @AuraEnabled public String key;
        @AuraEnabled public String comment;
        
        public ImageWrapper(String key, String comment) {
            this.key = key;
            this.comment = comment;
        }
    }

/**
     * @description 指定された募集住戸（Listing__c）に紐づく画像とコメントを取得します。
     * @param listingId 募集住戸ID
     * @return List<ImageWrapper> 画像キーとコメントのリスト
     */
    @AuraEnabled(cacheable=true)
    public static List<ImageWrapper> getListingImages(String listingId) {
        List<ImageWrapper> images = new List<ImageWrapper>();

        // 1. 住戸データの取得（コメント項目を追加）
        Listing__c listing = [
            SELECT Id, 
                   Building__r.ExteriorImageContentsKey__c,
                   (SELECT ImageContentsKey__c, Comment__c FROM ListingPhotos__r ORDER BY SortOrder__c ASC)
            FROM Listing__c
            WHERE Id = :listingId
            LIMIT 1
        ];

        // 2. 外観写真を追加（コメントは「外観」固定、または空文字）
        if (listing.Building__r != null && listing.Building__r.ExteriorImageContentsKey__c != null) {
            images.add(new ImageWrapper(listing.Building__r.ExteriorImageContentsKey__c, '外観'));
        }

        // 3. 住戸写真を追加
        if (listing.ListingPhotos__r != null) {
            for (ListingPhoto__c photo : listing.ListingPhotos__r) {
                // コメントがnullの場合は空文字を入れる
                String comment = (photo.Comment__c != null) ? photo.Comment__c : '';
                images.add(new ImageWrapper(photo.ImageContentsKey__c, comment));
            }
        }

        return images;
    }

    /**
     * @description IDのリストを指定して募集住戸を取得します（AI推奨物件の表示用）
     * @param listingIds 物件IDのリスト
     * @return List<Listing__c> 募集住戸リスト
     */
    @AuraEnabled
    public static List<Listing__c> getListingsByIds(List<String> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) {
            return new List<Listing__c>();
        }
        
        return [
            SELECT Id, Name, Rent__c, Status__c, FloorPlan__c, AreaSize__c, 
                   Building__r.Name, Building__r.ExteriorImageContentsKey__c, Building__r.WalkMinutes__c, 
                   Building__r.NearestStation__c, 
                   (SELECT Id, ImageContentsKey__c FROM ListingPhotos__r ORDER BY SortOrder__c ASC LIMIT 1) 
            FROM Listing__c 
            WHERE Id IN :listingIds
        ];
    }

    /**
     * @description Agentforce (generateAiAgentResponse) を Invocable Action 経由で呼び出すメソッド
     * @param userQuery ユーザーの入力メッセージ
     * @param agentApiName AgentのAPI参照名
     * @param sessionId 会話のセッションID（文脈維持用）
     * @return Agentからの出力パラメータを含むマップ (response, sessionId 等)
     */
    @AuraEnabled
    public static Map<String, Object> invokeAgent(String userQuery, String agentApiName, String sessionId) {
        try {
            // 現在のユーザータイプを確認
            String userType = UserInfo.getUserType();
            
            // パートナーユーザー ('PowerPartner') などの場合はプロキシ経由で実行
            if (userType == 'PowerPartner' || userType == 'CspLitePortal') {
                return invokeAgentViaProxy(userQuery, agentApiName, sessionId);
            } else {
                // 内部ユーザーは直接実行
                return invokeAgentDirectly(userQuery, agentApiName, sessionId);
            }

        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            throw new AuraHandledException('Agent呼び出し中にエラーが発生しました: ' + e.getMessage());
        }
    }

    // 指定ログイン情報を使ったループバック呼び出し
    private static Map<String, Object> invokeAgentViaProxy(String userQuery, String agentApiName, String sessionId) {
        HttpRequest req = new HttpRequest();
        // 指定ログイン情報 'LocalAgentCallout' を使用
        req.setEndpoint('callout:LocalAgentCallout/services/apexrest/AgentProxy');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');

        // タイムアウトを最大の120秒（2分）に設定
        // デフォルトは10秒のため、AIの回答待ちには短すぎます
        req.setTimeout(120000);
        
        Map<String, String> bodyMap = new Map<String, String>{
            'userQuery' => userQuery,
            'agentApiName' => agentApiName,
            'sessionId' => sessionId
        };
        req.setBody(JSON.serialize(bodyMap));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            return (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
        } else {
            throw new CalloutException('Proxy Error (' + res.getStatusCode() + '): ' + res.getBody());
        }
    }

    // 内部ユーザー用の直接呼び出し
    private static Map<String, Object> invokeAgentDirectly(String userQuery, String agentApiName, String sessionId) {
        // 1. Invocable Actionの作成
        // 標準アクション 'generateAiAgentResponse' を使用
        Invocable.Action action = Invocable.Action.createCustomAction('generateAiAgentResponse', agentApiName);

        // 2. パラメータの設定
        // 標準アクションの仕様に基づき 'userMessage' をセット
        action.setInvocationParameter('userMessage', userQuery);
        
        // セッションIDがあればセット（これで会話の記憶が繋がります）
        if (String.isNotBlank(sessionId)) {
            action.setInvocationParameter('sessionId', sessionId);
        }

        // 3. 実行
        List<Invocable.Action.Result> results = action.invoke();

        // 4. 結果の取得
        if (results.size() > 0 && results[0].isSuccess()) {
            // 結果マップ (response, sessionId) をそのまま返す
            return results[0].getOutputParameters();
        } else {
            // エラーログ
            String errorDetails = 'Agent Error: ';
            if (results.size() > 0 && results[0].getErrors().size() > 0) {
                errorDetails += results[0].getErrors()[0].getMessage();
            }
            System.debug(errorDetails);
            throw new CalloutException(errorDetails);
        }
    }

    /**
     * @description 内見予約データを作成します。
     * @param reservationData フォームからの入力値（Map）
     */
    @AuraEnabled
    public static void submitReservation(Map<String, Object> reservationData) {
        try {
            ViewingRequest__c req = new ViewingRequest__c();
            
            // 入力値をオブジェクトの項目にマッピング
            req.TargetListing__c = (Id)reservationData.get('listingId');
            
            String timeStr = (String)reservationData.get('preferredTime');
            if (String.isNotBlank(timeStr)) {
                req.PreferredTime__c = (DateTime)JSON.deserialize('"' + timeStr + '"', DateTime.class);
            }

            req.Name__c = (String)reservationData.get('name');
            req.Status__c = '調整中';
            
            req.Email__c = (String)reservationData.get('email');
            req.Phone__c = (String)reservationData.get('phone');
            req.Remarks__c = (String)reservationData.get('remarks');

            // ログインユーザーのContactIdを取得して Agent__c に設定
            // 仲介業者がログインして操作している前提
            Id currentUserId = UserInfo.getUserId();
            List<User> userWithContact = [SELECT ContactId FROM User WHERE Id = :currentUserId LIMIT 1];
            
            // ContactIdが存在する場合のみ設定（内部ユーザー等の場合はnullなので設定しない）
            if (!userWithContact.isEmpty() && userWithContact[0].ContactId != null) {
                req.Agent__c = userWithContact[0].ContactId; //
            }

            insert req;
            
        } catch (Exception e) {
            System.debug('Reservation Error: ' + e.getMessage());
            throw new AuraHandledException('予約の登録中にエラーが発生しました: ' + e.getMessage());
        }
    }

    /**
     * @description 指定物件の週間空き状況を取得する
     * @param listingId 物件ID
     * @param startDate 表示開始日（nullの場合は今日）
     * @return カレンダー表示用のマトリクスデータ
     */
    @AuraEnabled
    public static Map<String, Object> getWeeklyAvailability(Id listingId, Date startDate) {
        if (startDate == null) {
            startDate = Date.today();
        }
        
        // 1. 予約済みデータを取得 (キャンセル以外)
        // 対象期間: 開始日 00:00 〜 7日後 23:59
        DateTime rangeStart = DateTime.newInstance(startDate.year(), startDate.month(), startDate.day(), 0, 0, 0);
        DateTime rangeEnd = rangeStart.addDays(7);

        List<ViewingRequest__c> existingBookings = [
            SELECT PreferredTime__c 
            FROM ViewingRequest__c 
            WHERE TargetListing__c = :listingId 
            AND Status__c != 'キャンセル'
            AND PreferredTime__c >= :rangeStart
            AND PreferredTime__c < :rangeEnd
        ];

        // 検索しやすいように予約済み日時をSet文字列化 (yyyy-MM-dd HH:00)
        Set<String> bookedSlots = new Set<String>();
        for (ViewingRequest__c req : existingBookings) {
            if (req.PreferredTime__c != null) {
                bookedSlots.add(req.PreferredTime__c.format('yyyy-MM-dd HH:00'));
            }
        }

        // 2. カレンダーデータの構築
        // 営業時間を 10:00 - 18:00 (最終受付 17:00) とする
        List<Integer> hours = new List<Integer>{10, 11, 12, 13, 14, 15, 16, 17};
        
        // ヘッダー用日付リスト
        List<Map<String, String>> headers = new List<Map<String, String>>();
        for (Integer i = 0; i < 7; i++) {
            DateTime dt = rangeStart.addDays(i);
            headers.add(new Map<String, String>{
                'label' => dt.format('M/d(E)'), // 1/5(月) 形式
                'date' => dt.format('yyyy-MM-dd')
            });
        }

        // 行データの作成 (時間 x 日付)
        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        for (Integer h : hours) {
            Map<String, Object> row = new Map<String, Object>();
            row.put('timeLabel', h + ':00');
            
            List<Map<String, Object>> slots = new List<Map<String, Object>>();
            for (Integer d = 0; d < 7; d++) {
                DateTime currentSlot = rangeStart.addDays(d).addHours(h);
                String slotKey = currentSlot.format('yyyy-MM-dd HH:00');
                
                Boolean isBooked = bookedSlots.contains(slotKey);
                Boolean isPast = currentSlot < DateTime.now(); // 過去の日時は予約不可
                
                String status = 'available';
                String symbol = '◎';
                
                if (isPast) {
                    status = 'disabled';
                    symbol = '-';
                } else if (isBooked) {
                    status = 'booked';
                    symbol = '×';
                }

                slots.add(new Map<String, Object>{
                    'isoTime' => currentSlot.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.000\'Z\''), // モーダルに渡す用
                    'status' => status,
                    'symbol' => symbol,
                    'isClickable' => (status == 'available')
                });
            }
            row.put('slots', slots);
            rows.add(row);
        }

        return new Map<String, Object>{
            'headers' => headers,
            'rows' => rows,
            'currentStartDate' => startDate
        };
    }

    /**
     * @description ログインユーザー（仲介担当者）の担当予約一覧を取得
     */
    @AuraEnabled(cacheable=true)
    public static List<ViewingRequest__c> getMyUpcomingReservations() {
        Id currentUserId = UserInfo.getUserId();
        // ユーザーに紐づくContactIdを取得
        List<User> users = [SELECT ContactId FROM User WHERE Id = :currentUserId LIMIT 1];
        
        if (users.isEmpty() || users[0].ContactId == null) {
            // テスト用/内部管理者用: ContactIdがない場合は全件返すか、空を返す（今回は空）
            return new List<ViewingRequest__c>();
        }
        
        Id contactId = users[0].ContactId;

        return [
            SELECT Id, Name, Name__c, BuildingName__c, PreferredTime__c, Status__c, 
                   TargetListing__c, TargetListing__r.Name, Remarks__c, Phone__c, Email__c
            FROM ViewingRequest__c
            WHERE Agent__c = :contactId
            ORDER BY PreferredTime__c ASC
            LIMIT 200
        ];
    }

    /**
     * @description 予約をキャンセルする（ステータス更新）
     */
    @AuraEnabled
    public static void cancelReservation(Id reservationId) {
        try {
            ViewingRequest__c req = new ViewingRequest__c(
                Id = reservationId,
                Status__c = 'キャンセル'
            );
            update req;
        } catch (Exception e) {
            throw new AuraHandledException('キャンセル処理に失敗しました: ' + e.getMessage());
        }
    }

    /**
     * @description 担当者自身の週間スケジュールを取得する
     * @param startDate 表示開始日
     * @return カレンダー表示用のマトリクスデータ
     */
    @AuraEnabled
    public static Map<String, Object> getAgentWeeklySchedule(Date startDate) {
        if (startDate == null) {
            startDate = Date.today();
        }
        
        // 1. 自分の予約データを取得
        Id currentUserId = UserInfo.getUserId();
        List<User> users = [SELECT ContactId FROM User WHERE Id = :currentUserId LIMIT 1];
        if (users.isEmpty() || users[0].ContactId == null) {
            return new Map<String, Object>();
        }
        Id agentContactId = users[0].ContactId;

        DateTime rangeStart = DateTime.newInstance(startDate.year(), startDate.month(), startDate.day(), 0, 0, 0);
        DateTime rangeEnd = rangeStart.addDays(7);

        // 時間順に取得
        List<ViewingRequest__c> myBookings = [
            SELECT Id, Name__c, TargetListing__r.Name, BuildingName__c, PreferredTime__c, Status__c
            FROM ViewingRequest__c 
            WHERE Agent__c = :agentContactId 
            AND Status__c != 'キャンセル'
            AND PreferredTime__c >= :rangeStart
            AND PreferredTime__c < :rangeEnd
        ];

        // 検索用マップを作成 (キー: yyyy-MM-dd HH:00)
        Map<String, ViewingRequest__c> bookingMap = new Map<String, ViewingRequest__c>();
        for (ViewingRequest__c req : myBookings) {
            if (req.PreferredTime__c != null) {
                // 分単位は切り捨てて「枠」に合わせる簡易実装（本来は重複チェック等が必要）
                bookingMap.put(req.PreferredTime__c.format('yyyy-MM-dd HH:00'), req);
            }
        }

        // 2. カレンダー構造の構築
        List<Integer> hours = new List<Integer>{10, 11, 12, 13, 14, 15, 16, 17};
        
        // ヘッダー（日付）
        List<Map<String, String>> headers = new List<Map<String, String>>();
        for (Integer i = 0; i < 7; i++) {
            DateTime dt = rangeStart.addDays(i);
            headers.add(new Map<String, String>{
                'label' => dt.format('M/d(E)'),
                'date' => dt.format('yyyy-MM-dd')
            });
        }

        // 行データ（時間 x 日付）
        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        for (Integer h : hours) {
            Map<String, Object> row = new Map<String, Object>();
            row.put('timeLabel', h + ':00');
            
            List<Map<String, Object>> slots = new List<Map<String, Object>>();
            for (Integer d = 0; d < 7; d++) {
                DateTime currentSlot = rangeStart.addDays(d).addHours(h);
                String slotKey = currentSlot.format('yyyy-MM-dd HH:00');
                
                ViewingRequest__c booking = bookingMap.get(slotKey);
                
                // 予定があればその内容を、なければ空
                Map<String, Object> slotData = new Map<String, Object>{
                    'isoTime' => currentSlot.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.000\'Z\''),
                    'hasEvent' => (booking != null),
                    'eventClass' => (booking != null ? 'slds-box slds-box_xx-small slds-theme_shade slds-truncate' : ''),
                    'recordId' => (booking != null ? booking.Id : null)
                };

                if (booking != null) {
                    // 表示テキスト: 顧客名 / 物件名
                    slotData.put('customerName', booking.Name__c);

                    String displayName = '';
                    if (booking.BuildingName__c != null) {
                        displayName += booking.BuildingName__c + ' ';
                    }
                    displayName += booking.TargetListing__r.Name;
                    slotData.put('listingName', displayName);

                    // ステータスに応じた色分け用クラス（例: 調整中なら黄色など）
                    if (booking.Status__c == '調整中') {
                        slotData.put('eventClass', 'slds-box slds-box_xx-small slds-theme_warning slds-truncate');
                    } else if (booking.Status__c == '確定') {
                        slotData.put('eventClass', 'slds-box slds-box_xx-small slds-theme_success slds-theme_alert-texture slds-truncate');
                    }
                }

                slots.add(slotData);
            }
            row.put('slots', slots);
            rows.add(row);
        }

        return new Map<String, Object>{
            'headers' => headers,
            'rows' => rows,
            'currentStartDate' => startDate
        };
    }
}