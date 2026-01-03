@RestResource(urlMapping='/AgentProxy')
global without sharing class AgentProxy {
    
    // リクエストのボディ構造
    global class AgentRequest {
        public String userQuery;
        public String agentApiName;
        public String sessionId;
    }

    @HttpPost
    global static void invokeAgentProxy() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            // ボディをパース
            String jsonBody = req.requestBody.toString();
            AgentRequest requestData = (AgentRequest)JSON.deserialize(jsonBody, AgentRequest.class);
            
            // ★ここでAgentを実行（このクラスは管理者権限で動く）
            Invocable.Action action = Invocable.Action.createCustomAction('generateAiAgentResponse', requestData.agentApiName);
            action.setInvocationParameter('userMessage', requestData.userQuery);
            if (String.isNotBlank(requestData.sessionId)) {
                action.setInvocationParameter('sessionId', requestData.sessionId);
            }

            List<Invocable.Action.Result> results = action.invoke();

            if (results.size() > 0 && results[0].isSuccess()) {
                // 成功時は結果をそのまま返す
                res.responseBody = Blob.valueOf(JSON.serialize(results[0].getOutputParameters()));
                res.statusCode = 200;
            } else {
                // エラーハンドリング
                String errorMsg = 'Agent Error';
                if (results.size() > 0 && results[0].getErrors().size() > 0) {
                    errorMsg += ': ' + results[0].getErrors()[0].getMessage();
                }
                res.responseBody = Blob.valueOf(errorMsg);
                res.statusCode = 500;
            }
        } catch (Exception e) {
            res.responseBody = Blob.valueOf('Proxy Error: ' + e.getMessage());
            res.statusCode = 500;
        }
    }
}