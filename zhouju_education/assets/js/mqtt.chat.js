/* @file mqtt.chat.js
 * @date 2018.10.15 15:45:21
 */
! function (t, e) {
    t.Connection = {
        name: "Connection",
        debug: !0,
        client: null,
        mqttMessageTopic: "",
        mqttWillTopic: "",
        chatRouteTopic: "",
        sessionId: "",
        _urlExp: /(wss?:)\/\/(.*?)((:\d+)?)\/(\w+)/gi,
        _ssl: !1,
        _mqttserver: "",
        _clientId: "",
        _protocol: "",
        _host: "",
        _port: 80,
        _path: "",
        _options: "",
        _conn: !1,
        _reconnectCount: 0,
        _waitTime: 0,
        _timeout: 6,
        _keepAliveInterval: 60,
        eventCallback: {
            onConnectSuccess: {},
            onConnectFailure: {},
            onResponse: {},
            onPublish: {}
        },
        status: !0,
        connect: function (t, e) {
            return this._conn = !0, this.client && this.client.isConnected() ? (this._fireEvent("onConnectSuccess", this.mqttMessageTopic), !0) : this._connectMqtt(t, e)
        }, disconnect: function () {
            this._conn = !1, this.status = !1, this.client && this.client.isConnected() && this._disconnectMqtt()
        }, publish: function (e, s) {
            var i, n;
            return this.client && this.client.isConnected() ? e && "object" == typeof e ? (i = t.JSON.toJSONString(e), (s = s || this.chatRouteTopic) ? (n = this._mqttMessage(i, s), this.debug && t.Log(this._clientId + " $.Connection.publish(" + i + ", " + s + ")", 2), this.client.send(n)) : (this.debug && t.Log(this._clientId + " publish param topic is null>" + i), !1)) : (this.debug && t.Log(this._clientId + " publish param jsonMessage failure", 3), !1) : (this.debug && t.Log(this._clientId + " publish failure, client disconnect", 3), !1)
        }, register: function (e, s, i) {
            var n, o = !1;
            "function" == typeof i ? ("undefined" == typeof this.eventCallback[s] && (this.eventCallback[s] = {}), t.each(this.eventCallback[s], function (t, s) {
                s !== i && e !== t || (o = !0)
            }), !0 !== o && (this.debug && t.Log(this._clientId + " $.Connection.reqister(" + s + ")"), this.eventCallback[s][e] = i)) : "string" == typeof i && (n = methodName.split("."), mehtod = t, t.each(n, function (t, e) {
                mehtod = mehtod[e]
            }), "undefined" == typeof this.eventCallback[key] && (this.eventCallback[key] = {}), t.each(this.eventCallback[s], function (t, s) {
                s !== mehtod && e !== t || (o = !0)
            }), !0 !== o && (this.debug && t.Log(this._clientId + " $.Connection.reqister(" + methodName + ")"), this.eventCallback[s][e] = mehtod))
        }, unregister: function (e) {
            var s = this;
            t.each(this.eventCallback, function (i, n) {
                t.each(n, function (t, n) {
                    t === e && delete s.eventCallback[i][t]
                })
            })
        }, subscribe: function (e, s) {
            if (!this.client || !this.client.isConnected()) return !1;
            this.debug && t.Log(this._clientId + " $.Connection.subscribe(" + e + ")");
            s = t.extend({
                qos: 1
            }, s), this.client.subscribe(e, s)
        }, unsubscribe: function (e) {
            if (!this.client || !this.client.isConnected() || !e) return !1;
            this.debug && t.Log(this._clientId + " $.Connection.unsubscribe(" + e + ")"), this.client.unsubscribe(e)
        }, onConnectionLost: function (e) {
            0 !== e.errorCode && (this.debug && t.Log(this._clientId + " $.Connection.onConnectionLost() > " + e.errorMessage, 3), this._reconnectMqtt())
        }, onPublish: function (e) {
            var s, i;
            if (!this.client || !this.client.isConnected()) return !1;
            this.debug && t.Log(this._clientId + " $.Connection.onPublish() > " + e.payloadString, 2);
            try {
                s = t.JSON.parseJSON(e.payloadString)
            } catch (n) {
                try {
                    s = JSON.parse(e.payloadString)
                } catch (o) {
                    s = {}, t.Log("$.Connection.onPublish(): " + o.message, 3)
                }
            }
            "responseServer" === (i = s.method || "") ? this.responseServer.apply(this, Array.prototype.concat.call([e.destinationName], s.params)): i && this._fireEvent("onPublish", Array.prototype.concat.call([e.destinationName, i], s.params))
        }, responseServer: function (e, s, i, n, o) {
            var c = this;
            this.subscribe(i, {
                onSuccess: function (e) {
                    this.debug && t.Log(c._clientId + " $.Connection.subscribe()>" + $JSON.toJSONString(e), 2)
                }, onFailure: function (e) {
                    this.debug && t.Log(c._clientId + " $.Connection.subscribe()>" + $JSON.toJSONString(e), 3), c._fireEvent("onConnectSuccess", c.mqttMessageTopic)
                }
            }), this.subscribe(n), this._fireEvent("onResponse", e, s, i, n, o)
        }, getRegisterMethod: function () {
            return this.eventCallback
        }, _connectMqtt: function (e, s) {
            var i = this,
                n = e;
            if (!this._mqttserver || this._mqttserver !== n) {
                if (n = n || this._mqttserver, !this._format(n)) return !1;
                this.chatRouteTopic = "S/ROUTE/" + this._path
            }
            if (!this._clientId || this._clientId !== s) {
                if (this._clientId = s || this._clientId, !this._clientId) return !1;
                this.mqttMessageTopic = "C/" + this._clientId, this.mqttWillTopic = "S/WILL/" + this._clientId
            }
            this._options = {
                userName: "ntguest",
                password: "xiaoneng123",
                useSSL: this._ssl,
                timeout: this._timeout,
                keepAliveInterval: this._keepAliveInterval,
                cleanSession: !1,
                willMessage: this._mqttMessage("{}"),
                mqttVersion: 4,
                onSuccess: function () {
                    i._success()
                }, onFailure: function (t) {
                    i._failure(t)
                }
            }, t.browser.supportMqtt ? (this.client ? this.debug && t.Log("reconnect mqtt server", 2) : (this.debug && t.Log("connect mqtt server", 2), this.client = new t.MQTT.Client(this._host, this._port, this._clientId), this.client.onConnectionLost = function (t) {
                i.onConnectionLost(t)
            }, this.client.onMessageArrived = function (t) {
                i.onPublish(t)
            }), this.client.connect(this._options), this.debug && this.client.startTrace()) : (this.client = t.MQTT.flashSock, this.client.onConnectionLost = function (t) {
                i.onConnectionLost(t)
            }, this.client.onMessageArrived = function (t) {
                i.onPublish(t)
            }, this.client.init(this._host, this._port, this._clientId, this._options))
        }, _reconnectMqtt: function () {
            if ((!this.client || !this.client.isConnected()) && this._conn) {
                var e = this;
                if (++this._reconnectCount <= 3 ? this._waitTime = 50 : this._waitTime = 1e3 * +"034567890".charAt(Math.ceil(5 * Math.random())), this.debug && t.Log(this._clientId + " wait recontent mqtt:" + this._waitTime, 3), !this.status) return;
                this._fireEvent("onConnectFailure", this.mqttMessageTopic), setTimeout(function () {
                    e._connectMqtt(e._mqttserver, e._clientId)
                }, this._waitTime)
            }
        }, _disconnectMqtt: function () {
            var t = this._mqttMessage("{}");
            this.publish(t, this.mqttWillTopic), this.unsubscribe(this.mqttMessageTopic), this.client && (this.debug && this.client.stopTrace(), this.client.disconnect(), this.client.clear && this.client.clear()), this.client = null
        }, _format: function (e) {
            var s, i;
            return !(!e || "" === e) && (i = t.isObject(e) ? t.browser.supportMqtt ? "http:" === t.protocol && 1 != t.flashserver.usehttps ? e.ws ? e.ws : e.wss.replace(/^wss:/, "ws:") : e.wss ? e.wss : e.ws.replace(/^ws:/, "wss:") : e.tcp : e, (s = this._urlExp.exec(i)) && s.length || (s = i.replace(/(wss?|tcp):\/\//gi, ",$1,").replace(/:(\d+)/gi, ",$1").replace(/\//gi, ",").split(",")) && s.length || t.Log("url:" + i + ", math:" + s, 2), this._protocol = 1 == t.flashserver.usehttps ? "wss:" : s[1] || "ws:", this._ssl = "wss:" === this._protocol, this._host = s[2], this._port = Number(s[4] ? s[4].slice(1) : s[4]) || (this._ssl ? 443 : 80), this._path = s[5] || "mqtt", this._mqttserver = i, !0)
        }, _success: function () {
            this.debug && t.Log(this._clientId + " $.Connection connect success."), this._reconnectCount = 0, this.subscribe(this.mqttMessageTopic), this._fireEvent("onConnectSuccess", this.mqttMessageTopic)
        }, _failure: function (e) {
            this.debug && t.Log(this._clientId + " $.Connection connect failure."), this._fireEvent("onConnectFailure", this.mqttMessageTopic), this._reconnectMqtt()
        }, _fireEvent: function () {
            var e = this,
                s = Array.prototype.slice.call(arguments),
                i = s[0],
                n = s.slice(1);
            t.each(this.eventCallback[i], function (t, s) {
                "onResponse" === i ? s.apply(e, n.slice(1)) : s.apply(e, n)
            })
        }, _mqttMessage: function (e, s) {
            var i = new t.MQTT.Message(e);
            return s = s || this.mqttWillTopic, i.qos = 1, i.destinationName = s, i
        }
    }, t(window).bind("unload", function () {
        t.Connection.disconnect()
    })
}(nTalk),
function (t, e) {
    t.Connection.TChat = t.Class.create(), t.Connection.TChat.prototype = {
        name: "TChat",
        options: null,
        data: null,
        connect: null,
        debug: !1,
        login: !1,
        connected: !1,
        status: !1,
        defBody: {
            bold: !1,
            italic: !1,
            color: "000000",
            fontsize: "14",
            underline: !1
        },
        clientWillTopic: "",
        serverTopic: "",
        clientTopic: "",
        _reconnect_mqtt_count: 0,
        _reconnect_tchat_count: 0,
        _waitReconnectTimeID: null,
        _roomConnectTimeID: null,
        _roomConnectTimeout: 5e3,
        roomConnectTimeout: 2e3,
        robotQueue: 0,
        _roomConnect_count: 0,
        startType: 0,
        initialize: function (e) {
            this.sendHASH = new t.HASH, this.receiveHASH = new t.HASH, this.completeHASH = new t.HASH, this.data = t.store, this._reconnect_tchat_count = 0, this._reconnect_mqtt_count = 0, this._roomConnect_count = 0, this.options = t.extend({
                deviceType: t.browser.mobile ? 3 : 0,
                chatType: "0",
                chatValue: "0"
            }, t.whereGet(e, ["siteid", "settingid", "tchatmqttserver", "tchatgoserver", "serverurl", "machineID", "userid", "username", "sessionid", "destid", "resourceurl", "statictis", "htmlsid", "connectid", "userlevel", "disconnecttime", "mini", "chattype", "chatvalue", "edu_invisitid", "edu_visitid", "usertag", "userrank", "leftchat", "startType"], ["siteId", "settingId", "tchatmqttserver", "tchatgoserver", "serverurl", "machineID", "userId", "userName", "sessionId", "targetId", "resourceurl", "statictis", "htmlSid", "connectId", "userLevel", "disconnectTime", "mini", "chatType", "chatValue"])), this.options.edu_invisitid ? this.startType = 1 : this.startType = 0, 1 == this.options.leftchat && (this.startType = this.options.startType), (!this.options.machineID || this.options.machineID.length <= 10) && (this.options.machineID = this.data.get("machineid"), (!this.options.machineID || this.options.machineID.length <= 10) && (this.options.machineID = t.base._createScriptPCID())), this.data.set("machineid", this.options.machineID);
            var s = this.options.tchatmqttserver.toString().split(";");
            this.options.tchatmqttserver = {};
            for (var i = 0; i < s.length; i++) s[i] && (s[i].indexOf("ws:") > -1 ? this.options.tchatmqttserver.ws = s[i] : s[i].indexOf("wss:") > -1 ? this.options.tchatmqttserver.wss = s[i] : s[i].indexOf("tcp") > -1 && (this.options.tchatmqttserver.tcp = s[i]));
            this.clientId = this.options.connectId, this.options.userId || (this.options.userId = t.base.userIdFix + this.options.machineID.substr(0, 21)), this.debug && t.Log("initialize mqtt chatConnect"), this.status = !0, this.firstConnected = !0, this._initQueue(), this.loginConnect()
        }, loginConnect: function () {
            var e = this;
            t.Log("connect tChat", 1), this.connect = t.Connection, this.connect.register(this.options.settingId, "onConnectSuccess", function () {
                e.requestServer()
            }), this.connect.register(this.options.settingId, "onConnectFailure", function () {
                e._onAbnormal.apply(e, arguments), t.browser.supportMqtt ? e._callback("fIM_callStat", ["mqtt", e.options.settingId, "failure"]) : e._callback("fIM_callStat", ["flash", e.options.settingId, "failure"])
            }), this.connect.register(this.options.settingId, "onResponse", function (s, i, n, o) {
                e.roomConnect(s, i, n, o), t.browser.supportMqtt ? e._callback("fIM_callStat", ["mqtt", e.options.settingId, "success"]) : e._callback("fIM_callStat", ["flash", e.options.settingId, "success"])
            }), this.connect.register(this.options.settingId, "onPublish", function () {
                e._onCallback.apply(e, arguments)
            }), this.connect.connect(this.options.tchatmqttserver, e.clientId), this.sessionIdleReplys = {}, this.sessionIdleReplys[+this.options.disconnectTime] = "超时未发送消息，自动断开连接"
        }, requestServer: function () {
            var t = this;
            if (this.connected) return !1;
            this.connected = !0, this.connect.publish({
                method: "requestServer",
                params: [this.options.userId, this.clientId, this.options.settingId, this.options.targetId, this.options.sessionId]
            }, this.connect.chatRouteTopic), this._roomConnectTimeID = setTimeout(function () {
                t.reconnect()
            }, this._roomConnectTimeout)
        }, roomConnect: function (e, s, i, n) {
            var o = this;
            if (this.options.settingId !== n) return !1;
            t.Log("$.Connection.TChat.roomConnect(" + e + ", " + s + ", " + i + ", " + n + ")"), this.clientTopic = e, this.clientWillTopic = s, this.serverTopic = i;
            var c = '{inviteid:"' + this.options.edu_invisitid + '",visitid:"' + this.options.edu_visitid + '"}';
            this.connect.publish({
                method: "roomConnect",
                params: [this.options.userId, "", this.options.sessionId, this.options.targetId, this.options.machineID, this.options.deviceType, this.options.chatType, this.options.chatValue, this.options.userName, this.options.userLevel, this.options.settingId, this._roomConnect_count, this.startType, c, {
                    userrank: this.options.userrank,
                    usertag: this.options.usertag
                }]
            }, this.clientTopic), o._roomConnect_count = 1
        }, stopReroomConnect: function () {
            clearTimeout(this._roomConnectTimeID), this._roomConnectTimeID = null, this.connected = !0
        }, isOk: function () {
            try {
                return this.connected && this.connect && this.connect.client && this.connect.client.isConnected()
            } catch (t) {
                return !1
            }
        }, startKaliveConnect: function () {
            var e = this;
            this.stopKaliveConnect(), this.kaliveTimeId = setInterval(function () {
                t.Log("nTalk.TChat.kaliveConnect()", 1), e.connect.publish({
                    method: "remoteKeepAlive",
                    params: [e.options.clientId, e.options.userId]
                }, e.clientTopic)
            }, 6e4)
        }, stopKaliveConnect: function () {
            clearInterval(this.kaliveTimeId), this.kaliveTimeId = null
        }, reconnect: function () {
            var e = this;
            this.connected = !1, this.connect.unsubscribe(this.clientWillTopic), this.connect.unsubscribe(this.serverTopic), this.connect.unregister(this.options.settingId), ++this._reconnect_tchat_count <= 3 ? this._waitTime = 500 : this._waitTime = 1e3 * +"034567890".charAt(Math.ceil(5 * Math.random())), t.Log("TChat.reconnect(): waitTime:" + this._waitTime), this.status ? this._waitReconnectTimeID = setTimeout(function () {
                e.loginConnect()
            }, this._waitTime) : t.Log("stop reconnect")
        }, disconnect: function (t) {
            var e = this;
            for (var s in this.sessionIdleReplys) this.sessionIdleTimeouts && this.sessionIdleTimeouts[s] && clearTimeout(this.sessionIdleTimeouts[s].id);
            this.status = !1, this.login = !1, this.connected = !1, clearTimeout(this._waitReconnectTimeID), this._waitReconnectTimeID = null, this.stopKaliveConnect(), e.options.clientId && this.clientTopic && this.connect.publish({
                method: "remoteEndConnection",
                params: [e.options.clientId, e.options.userId]
            }, this.clientTopic), this.connect.unsubscribe(this.clientWillTopic), this.connect.unsubscribe(this.serverTopic), this.connect.unregister(this.options.settingId), t && this.connect.disconnect(), this.clientTopic = "", this.clientWillTopic = "", this.serverTopic = ""
        }, sendMessage: function (e) {
            var s, i;
            e = t.isObject(e) ? e : t.JSON.parseJSON(e), e = t.charFilter(e), i = t.whereGet(e, ["type", "msgid"], ["type", "msgid"]), e.url && (i = t.extend(i, t.whereGet(e, ["url", "emotion", "oldfile", "size", "extension", "sourceurl", "mp3", "length"]))), e.hidden && (i = t.extend(i, t.whereGet(e, ["hidden"]))), s = {
                flashuid: e.timerkeyid,
                msgid: e.msgid,
                src: e,
                json: {},
                xml: ""
            }, "object" == typeof e.msg ? s.json.msg = t.extend(e.msg, {
                attributes: i
            }) : (i = t.extend({}, i, this.defBody), s.json.msg = t.extend({
                text: e.msg
            }, {
                attributes: i
            })), e.msg.evaluate && (s.json.msg.evaluate = t.JSON.toJSONString(e.msg.evaluate)), s.xml = t.jsonToxml(s.json), this.sendHASH.add(s.msgid, s), 5 === e.type || this.robotQueue || this.processSessionIdle(), this.messageQueue.addMessage(s), this.startSend(s)
        }, sendAbnormal: function (e) {
            if (!this.completeHASH.contains(e)) {
                var s = this.sendHASH.items(e),
                    i = t.getTime(),
                    n = t.extend({
                        type: 9,
                        msgType: 2,
                        timesample: i,
                        msgid: i + "J",
                        userid: "system"
                    }, s.src);
                this._callback("fIM_receiveMessage", [n])
            }
        }, startSend: function (e) {
            e && this.login && (e.timestamp && e.recount || (e.timestamp = t.getTime(), e.recount = 1), this.connect.publish({
                method: "remoteSendMessage",
                params: [this.options.userId, this.options.clientId, this.options.sessionId, e.xml, e.flashuid]
            }, this.clientTopic))
        }, _callbackComplete: function (t, e) {
            t && (this.messageQueue.removeMessage(e), this.completeHASH.add(e, this.sendHASH.items(e)))
        }, verificationMessage: function () {
            for (var e = this.messageQueue.first(), s = t.getTime(), i = 0; e;) {
                if (5 === e.src.type) this.messageQueue.removeMessage(e.msgid);
                else if (s - e.timestamp >= 3e3)
                    if (e.recount >= 3) this.sendAbnormal(e.msgid), this.messageQueue.removeMessage(e.msgid);
                    else {
                        if (i >= 2) {
                            e = this.messageQueue.nextMessage(e.msgid);
                            continue
                        }
                        i++, e.timestamp = s, e.recount++, this.login ? this.startSend(e) : this.sendAbnormal(e.msgid)
                    }
                e = this.messageQueue.nextMessage(e.msgid)
            }
        }, closeTChat: function () {
            this.disconnect()
        }, setTextStyle: function (t) {
            t && t.fontsize && (this.defBody.fontsize = t.fontsize)
        }, predictMessage: function (t) {
            this.connect.publish({
                method: "onPredictMessage",
                params: [this.options.sessionId, this.options.userId, t]
            }, this.clientTopic)
        }, LoginResult: function (e, s, i, n, o, c) {
            this.login = !0 === e, this.options.result = !0 === e ? 1 : 0, this.options.clientId = s, this.options.sessionId = n, this.options.soid = o, this.options.time = c;
            try {
                this.options.userInfo = t.JSON.parseJSON(i)
            } catch (r) {
                this.options.userInfo = this.options.userInfo || {}
            }
            this.stopReroomConnect(), this._callback("fIM_tchatFlashReady", [this.options.userId, this.options.machineID]), this.options.result && (!0 === this.firstConnected && (this.firstConnected = !1, this.processSessionIdle()), this.userInfo = {
                myuid: this.options.userInfo.userid,
                myuname: this.options.userInfo.username,
                signature: "",
                mylogo: this.options.userInfo.usericon || "",
                sessionid: this.options.sessionId,
                timesample: this.options.time
            }), this.options.userInfo && !1 === this.options.userInfo.connectable ? this._callback("fIM_onGetUserInfo", ['{"status": 0}']) : (this.options.result ? (this.startKaliveConnect(), this._reconnect_tchat_count = 0, this.flashgourl = this.disconecturl(this.options.tchatgoserver), this._callback("fIM_setTChatGoServer", [this.flashgourl])) : (this.reconnect("login relogin"), this.userInfo = "", this.stopKaliveConnect()), this._callback("fIM_ConnectResult", [this.options.result, this.userInfo, ""]))
        }, disconecturl: function (e) {
            return e + "?" + t.toURI({
                from: "TCHAT",
                cid: this.options.clientId,
                sitid: this.options.siteId,
                uid: this.options.userId,
                ts: t.getTime()
            })
        }, remoteHistroyMessage: function () {
            for (var e, s, i, n = this, o = (arguments[0], 0), c = [], r = {
                history: 1
            }, l = {
                userId: this.options.userInfo.userid,
                userName: this.options.userInfo.username,
                cid: this.options.userInfo.pcid || NTKF.global.pcid
            }, a = 1; a < arguments.length; a++) switch (a % 4) {
            case 1:
                r.timestamp = arguments[a];
                break;
            case 2:
                r.userid = arguments[a];
                break;
            case 3:
                (r = t.extend(r, t.whereGet(t.JSON.parseJSON(arguments[a]), ["externalname", "usericon", "nickname", "username"], ["name", "logo", "nickname", "username"]))).name = r.name || r.nickname || r.username || "";
                break;
            case 0:
                if (null === (e = arguments[a]) || "" === e || -1 != e.indexOf("<msgtype")) continue;
                if (e = e.replace(/<\?xml\s+version=\"1\.0\"\s+encoding=\"utf\-\d+\"\?>/gi, ""), e = e.replace(/&(?!amp;)/gi, "&amp;"), s = t.htmlToElement(e)[0], "true" == (i = s && 3 == s.nodeType ? {
                    msg: s.textContent
                } : t.elementToObject(s)).xnlink && i.msg && 7 != i.type) {
                    p = new RegExp(/\[[0-9]*\].+[\n]/g);
                    i.msg = i.msg.replace("&amp;lt;![CDATA[", "").replace("<![CDATA[", "").replace("]]>", "");
                    d = i.msg.match(p);
                    if (i.msg = i.msg.replace(/&amp;/gi, "&"), (i.msg.indexOf("&lt;") > -1 || i.msg.indexOf("&gt;") > -1) && (i.msg = i.msg.replace(/[\n]/gi, "")), d && d.length > 0)
                        for (var h = 0, u = d.length; h < u; h++) {
                            f = d[h].replace(/[\n]/g, "");
                            if (i.msg.indexOf("&lt;") > -1 || i.msg.indexOf("&gt;") > -1) _ = "[xnlink]" + f + "[/xnlink]\n";
                            else _ = "[xnlink]" + f + "[/xnlink]";
                            i.msg = i.msg.replace(f, _)
                        }
                    i.msg = i.msg.replace(/&lt;/g, "<"), i.msg = i.msg.replace(/&gt;/g, ">")
                } else if (7 == i.type && e) {
                    var g = e.replace(/</g, "&lt;").replace(/>/g, "&gt;").match("&lt;content&gt;(.+?)&lt;/content&gt;");
                    if (g && g.length >= 2 && (i.msg = t.base64.decode(g[1])), i.flowlist) {
                        var m = i.flowlist.split(","),
                            p = new RegExp(/\[[0-9]*\].+[\n]/g);
                        i.msg = i.msg.replace("&amp;lt;![CDATA[", "").replace("<![CDATA[", "").replace("]]>", "");
                        d = i.msg.match(p);
                        if (i.msg = i.msg.replace(/&amp;/gi, "&"), i.msg = i.msg.replace(/[\n]/gi, ""), i.msg = i.msg.replace(/</g, "&lt;"), i.msg = i.msg.replace(/>/g, "&gt;"), d && d.length > 0)
                            for (var h = 0, u = d.length; h < u; h++) {
                                f = d[h].replace(/[\n]/g, "");
                                if (i.msg.indexOf("&lt;") > -1 || i.msg.indexOf("&gt;") > -1) _ = '[xnflowlink flowid="' + m[h] + '" ]' + f + "[/xnflowlink]\n";
                                else _ = '[xnflowlink flowid="' + m[h] + '" ]' + f + "[/xnflowlink]";
                                i.msg = i.msg.replace(f, _)
                            }
                        i.msg = i.msg.replace(/&lt;/g, "<"), i.msg = i.msg.replace(/&gt;/g, ">")
                    }
                    if ("true" == i.xnlink && !i.flowlist) {
                        p = new RegExp(/\[[0-9]*\].+[\n]/g);
                        i.msg = i.msg.replace("&amp;lt;![CDATA[", "").replace("<![CDATA[", "").replace("]]>", "");
                        var d = i.msg.match(p);
                        if (i.msg = i.msg.replace(/&amp;/gi, "&"), i.msg = i.msg.replace(/[\n]/gi, ""), i.msg = i.msg.replace(/</g, "&lt;"), i.msg = i.msg.replace(/>/g, "&gt;"), d && d.length > 0)
                            for (var h = 0, u = d.length; h < u; h++) {
                                var f = d[h].replace(/[\n]/g, "");
                                if (i.msg.indexOf("&lt;") > -1 || i.msg.indexOf("&gt;") > -1) _ = "[xnlink]" + f + "[/xnlink]\n";
                                else var _ = "[xnlink]" + f + "[/xnlink]";
                                i.msg = i.msg.replace(f, _)
                            }
                        i.msg = i.msg.replace(/&lt;/g, "<"), i.msg = i.msg.replace(/&gt;/g, ">")
                    }
                } else if (i.msg = s.textContent || s.text, "string" == typeof i.msg) {
                    try {
                        i.msg = this.regTu(i.msg, l)
                    } catch (I) {}
                    i.msg = i.msg.replace(/&lt;/g, "<"), i.msg = i.msg.replace(/&gt;/g, ">")
                }
                if ("ch" == i.msg || "fq" == i.msg) continue;
                r = t.extend(r, this.defBody, i), c.push(r), this.sendHASH.contains(r.msgid) && this._callbackComplete(!0, r.msgid), r = {
                    history: 1
                }
            }
            t.each(c, function (t, e) {
                setTimeout(function () {
                    n._callback("fIM_receiveMessage", [e])
                }, o), o += 50
            })
        }, remoteSendMessage: function (e, s, i, n, o) {
            var c, r, l, a, h = {
                userId: this.options.userInfo.userid,
                userName: this.options.userInfo.username,
                cid: this.options.userInfo.pcid || NTKF.global.pcid
            };
            if (n && !(n.indexOf('type="5"') > -1 && -1 === n.indexOf('systype="5"'))) {
                i && "string" == typeof i && (i = t.JSON.parseJSON(i), (r = t.whereGet(i, ["usericon", "userid", "externalname"], ["logo", "userid", "name"])).name = r.name || i.username), n = n.replace(/<\?xml\s+version=\"1\.0\"\s+encoding=\"utf\-\d+\"\?>/gi, ""), n = n.replace(/&(?!amp;)/gi, "&amp;");
                try {
                    l = (a = t.htmlToElement(n)[0]) && 3 == a.nodeType ? {
                        type: 1,
                        msg: a.textContent,
                        msgid: o + "x"
                    } : t.elementToObject(a)
                } catch (v) {
                    return void t.Log("remoteSendMessage:" + v.description + "; xmlString:" + n, 3)
                }
                if ("true" == l.xnlink && l.msg && 7 != l.type) {
                    d = new RegExp(/\[[0-9]*\].+[\n]/g);
                    l.msg = l.msg.replace("&amp;lt;![CDATA[", "").replace("<![CDATA[", "").replace("]]>", "");
                    f = l.msg.match(d);
                    if (l.msg = l.msg.replace(/&amp;/gi, "&"), (l.msg.indexOf("&lt;") > -1 || l.msg.indexOf("&gt;") > -1) && (l.msg = l.msg.replace(/[\n]/gi, "")), f && f.length > 0)
                        for (var u = 0, g = f.length; u < g; u++) {
                            _ = f[u].replace(/[\n]/g, "");
                            if (l.msg.indexOf("&lt;") > -1 || l.msg.indexOf("&gt;") > -1) I = "[xnlink]" + _ + "[/xnlink]\n";
                            else I = "[xnlink]" + _ + "[/xnlink]";
                            l.msg = l.msg.replace(_, I)
                        }
                    l.msg = l.msg.replace(/&lt;/g, "<"), l.msg = l.msg.replace(/&gt;/g, ">")
                } else if (7 == l.type && n) {
                    var m = n.replace(/</g, "&lt;").replace(/>/g, "&gt;").match("&lt;content&gt;(.+?)&lt;/content&gt;");
                    if (m && m.length >= 2 && (l.msg = t.base64.decode(m[1])), l.flowlist) {
                        var p = l.flowlist.split(","),
                            d = new RegExp(/\[[0-9]*\].+[\n]/g);
                        l.msg = l.msg.replace("&amp;lt;![CDATA[", "").replace("<![CDATA[", "").replace("]]>", "");
                        f = l.msg.match(d);
                        if (l.msg = l.msg.replace(/&amp;/gi, "&"), l.msg = l.msg.replace(/[\n]/gi, ""), l.msg = l.msg.replace(/</g, "&lt;"), l.msg = l.msg.replace(/>/g, "&gt;"), f && f.length > 0)
                            for (var u = 0, g = f.length; u < g; u++) {
                                _ = f[u].replace(/[\n]/g, "");
                                if (l.msg.indexOf("&lt;") > -1 || l.msg.indexOf("&gt;") > -1) I = '[xnflowlink flowid="' + p[u] + '" ]' + _ + "[/xnflowlink]\n";
                                else I = '[xnflowlink flowid="' + p[u] + '" ]' + _ + "[/xnflowlink]";
                                l.msg = l.msg.replace(_, I)
                            }
                        l.msg = l.msg.replace(/&lt;/g, "<"), l.msg = l.msg.replace(/&gt;/g, ">")
                    }
                    if ("true" == l.xnlink && !l.flowlist) {
                        d = new RegExp(/\[[0-9]*\].+[\n]/g);
                        l.msg = l.msg.replace("&amp;lt;![CDATA[", "").replace("<![CDATA[", "").replace("]]>", "");
                        var f = l.msg.match(d);
                        if (l.msg = l.msg.replace(/&amp;/gi, "&"), l.msg = l.msg.replace(/[\n]/gi, ""), l.msg = l.msg.replace(/</g, "&lt;"), l.msg = l.msg.replace(/>/g, "&gt;"), f && f.length > 0)
                            for (var u = 0, g = f.length; u < g; u++) {
                                var _ = f[u].replace(/[\n]/g, "");
                                if (l.msg.indexOf("&lt;") > -1 || l.msg.indexOf("&gt;") > -1) I = "[xnlink]" + _ + "[/xnlink]\n";
                                else var I = "[xnlink]" + _ + "[/xnlink]";
                                l.msg = l.msg.replace(_, I)
                            }
                        l.msg = l.msg.replace(/&lt;/g, "<"), l.msg = l.msg.replace(/&gt;/g, ">")
                    }
                } else if (l.msg = a.textContent || a.text, "string" == typeof l.msg) {
                    try {
                        l.msg = this.regTu(l.msg, h)
                    } catch (v) {}
                    l.msg = l.msg.replace(/&lt;/g, "<"), l.msg = l.msg.replace(/&gt;/g, ">")
                }
                c = t.extend({}, this.defBody, l, r, {
                    timestamp: e
                }), this.sendHASH.contains(c.msgid) && this._callbackComplete(!0, c.msgid), this.sendHASH.contains(c.msgid) || this.receiveHASH.contains(c.msgid) || (this._callback("fIM_receiveMessage", [c]), t.browser.mobile && t.isEdu && this._callback("fim_offlineMssage", [c.msg, "", c]), t.browser.mobile && t.isAutoEdu && this._callback("fIM_eduWapReceiveMessage", [c]), this.receiveHASH.add(c.msgid, c))
            }
        }, regTu: function (t, e) {
            var s = [],
                i = "";
            i = t.indexOf("&amp;") ? t.replace(/&amp;/gi, "&") : t;
            var n = new RegExp(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/gi);
            s = i.match(n);
            for (var o = 0; o < s.length; o++) {
                var c, r = "",
                    l = "";
                if (s[o].indexOf("ntform=1") > -1) {
                    if (c = s[o].replace(/ntform=1/gi, "userId=" + e.userId + "&userName=" + e.userName + "&cid=" + e.cid), s[o].split("?")[1].split("&").length > 1) {
                        for (var a = s[o].split("?")[1].split("&"), h = 0; h < a.length; h++) "ntform=1" == a[h] ? l += "" : l += a[h] + "&";
                        l = "?" + l.substr(0, l.length - 1)
                    }
                    r = "ntform=1" == s[o].split("?")[1] ? s[o].split("?")[0] : s[o].split("?")[0] + l, i = i.replace(s[o].substr(0, s[o].length), '&lt;a href="' + c + '"&gt;' + r + "&lt;/a&gt;")
                }
            }
            return i
        }, remoteNotifyUserList: function (e) {
            var s = [];
            try {
                s = t.JSON.parseJSON(e)
            } catch (n) {
                t.Log("remoteNotifyUserList toJSON abnormal", 3)
            }
            for (var i = 0; i < s.length; i++) s[i].userId == this.options.userId && s.splice(i, 1);
            this._callback("fIM_notifyUserNumbers", [s.length]), this._callback("fIM_notifyUserList", [t.JSON.toJSONString(s)])
        }, remoteSearchWaiter: function (t, e) {
            this._callback("fIM_onGetUserInfo", [e])
        }, remoteNotifyUserInformation: function (t, e) {
            t != this.options.userId && this._callback("fIM_onGetUserInfo", [e])
        }, remoteNotifyUserEnter: function (t, e) {
            this.options.targetId = t, this._callback("fIM_notifyUserEnter", [this.options.targetId, e, ""])
        }, remoteNotifyUserLeave: function (e) {
            t.Log("tchat.remoteNotifyUserLeave(" + e + ")", 2), this._callback("fIM_notifyUserLeave", [e])
        }, remoteNotifyUserClose: function (t, e) {
            t == this.options.clientId && (this._callback("fIM_ConnectResult", [5, "", ""]), this.disconnect(), this._callback("fIM_ConnectResult", [4, "", ""]))
        }, remoteNotifySessionScene: function (t) {
            this._callback("fIM_onNotifySessionSence", [t])
        }, remoteNotifyUserInputing: function (t, e) {
            this._callback("fIM_notifyUserInputing", [e])
        }, remoteRequestEvalute: function (t, e, s, i) {
            this._callback("fIM_requestEvaluate", [e, s, i])
        }, processSessionIdle: function () {
            var e = this;
            this.sessionIdleTimeouts || (this.sessionIdleTimeouts = {}), t.each(this.sessionIdleReplys, function (t, s) {
                e.sessionIdleTimeouts[t] && clearTimeout(e.sessionIdleTimeouts[t].id), e.sendIdleReply(t)
            })
        }, clearSessionIdle: function () {
            var e = this;
            this.sessionIdleTimeouts || (this.sessionIdleTimeouts = {}), t.each(this.sessionIdleReplys, function (t, s) {
                e.sessionIdleTimeouts[t] && clearTimeout(e.sessionIdleTimeouts[t].id)
            })
        }, sendIdleReply: function (e) {
            var s = this,
                i = t.extend(this.sessionIdleTimeouts[e], {
                    start: t.formatDate(),
                    id: setTimeout(function () {
                        var i = 0,
                            n = s.sessionIdleReplys[e];
                        delete s.sessionIdleReplys[e], s.sessionIdleTimeouts[e].end = t.formatDate(), t.each(s.sessionIdleReplys, function (t) {
                            i++
                        }), t.Log("setTimeout " + e + "s " + s.sessionIdleTimeouts[e].end + ", disconnect tchat", 1), 0 === i && s.connect && s.options.result && (s._callback("fIM_ConnectResult", [4, "", n]), s.disconnect())
                    }, 1e3 * e)
                });
            this.sessionIdleTimeouts[e] = i
        }, _toArray: function (e, s) {
            var i = [];
            if (!e) return "error";
            for (var n = 0; n < s.length; n++) i.push(t.isDefined(e[s[n]]) ? e[s[n]] : "");
            return i
        }, _handleResponse: function (e, s) {
            this[e] ? this[e].apply(this, s) : t.Log("The object of the method '" + e + "' does not exist", 3)
        }, _callback: function (e, s) {
            if (s.push(this.options.settingId), t.hasOwnProperty(e)) try {
                t[e].apply(this, s)
            } catch (i) {} else t.Log("nTalk." + e + "(...)", 2)
        }, _onCallback: function (t) {
            var e, s, i = this;
            if (t.length) return e = t[0], s = t[1], e === this.clientWillTopic && "reconnect" === s ? (this.reconnect(), !1) : e === this.serverTopic && void("LoginResult" === s ? this.LoginResult.apply(i, t.slice(2)) : this._handleResponse.call(i, s, t.slice(2)))
        }, _onAbnormal: function () {
            this.connected = !1, this._reconnect_mqtt_count++, this._reconnect_mqtt_count > 3 && (this._callback("fIM_ConnectResult", [2, "", "连接服务器超时，请稍后重试！"]), this._reconnect_mqtt_count = 0)
        }, _initQueue: function () {
            var e = this;
            this.messageQueue = new t.Queue, this.messageQueue.first = function () {
                return this.queueFront()
            }, this.messageQueue.nextMessage = function (t) {
                if (!this.list.length) return null;
                if (!t) return this.list[0];
                for (var e = 0; e < this.list.length; e++)
                    if (this.list[e].msgid == t) return this.list[e + 1];
                return null
            }, this.messageQueue.removeMessage = function (t) {
                for (var e = [], s = 0; s < this.list.length; s++) this.list[s].msgid == t || e.push(this.list[s]);
                this.list = e, this.length = e.length
            }, this.messageQueue.addMessage = function (t) {
                for (var e = 0; e < this.list.length; e++)
                    if (this.list[e].msgid == t.msgid) return !1;
                return this.list.push(t), this.length = this.list.length, !0
            }, this.messageQueue.getSendingNum = function () {
                for (var t = 0, e = 0; e < this.list.length; e++) this.list[e].status && t++;
                return t
            }, this.sendIntervalID = setInterval(function () {
                e.verificationMessage()
            }, 1e3)
        }
    }
}(nTalk);