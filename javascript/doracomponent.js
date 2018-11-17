var DoraConst = {
    FIELD_NEW_FLAG: "NEW_FLAG",
    FIELD_UPDATE_FLAG: "UPDATE_FLAG",
    /*テンプレート内は記述できないので注意！ */
    FIELD_DELETE_FLAG: "DELETE_FLAG",
    /*テンプレート内は記述できないので注意！ */
    FIELD_ERROR_FLAG: "ERROR_FLAG",
    /*自動的に連番付与するフィールド*/
    FIELD_IDENTITY_ID: "IDENTITY_ID"
};

Vue.directive('dora_table', {

    componentUpdated: function (el, binding, vnode) {
        let theadArray = el.querySelectorAll('thead');
        let widthArray = [];

        if (theadArray.length > 0) {
            let trArray = theadArray[0].querySelectorAll('tr');
            if (trArray.length > 0) {
                let thArray = trArray[0].querySelectorAll('th');

                let width = 0;
                for (let i = 0; i < thArray.length; i++) {
                    let currentWidth = parseInt(thArray[i].style.width);

                    widthArray.push(currentWidth);
                    width += currentWidth;  //obj.st.clientWidth;

                }
                //alert(width);
                el.style.width = width + 'px'; //clientWidth = width;

            }
        }

        let tbodyArray = el.querySelectorAll('tbody');

        if (widthArray.length > 0 && tbodyArray.length > 0) {
            let trArray = tbodyArray[0].querySelectorAll('tr');

            //if (trArray.length > 0) {
            //edgeだと全件ループしないと正しくセットされない（chrome,ieは最初の一件で問題ない）
            for (let i = 0; i < trArray.length; i++) {
                let tdArray = trArray[i].querySelectorAll('td');

                if (tdArray.length > 0) {

                    //alert(tbodyArray.length);

                    for (let i = 0; i < widthArray.length; i++) {

                        let width = widthArray[i];

                        let obj = tdArray[i];

                        //存在する場合
                        if (obj) {
                            obj.style.width = width + 'px';
                        }
                    }
                }
            }

        }
    }
}
);

// v-dora_updateflag.bindingvaluedisp 指定でフォーカス取得時 バインディングの値をそのままセット
// v-dora_updateflag.bindingvaluedispをセットし、dora_format="#,###" とした場合、入力は 1000(modelの値) 表示は1,000 となる

//外部から参照用
//(エレメント).isinputerror()      エラーの場合：true
//(エレメント).checkvalidate()     エラーチェックを個別に実行
//(エレメント).isinputdata()         入力されたかどうか

//外部から呼ばれる関数(v-on:change イベントと併用した場合 v-on:changeが実行されるので、先にcheckvalidateを実行する必要がある)

Vue.directive('dora_updateflag', {
    //データ更新時にフラグを追加
    bind: function (el, binding, vnode) {

        //あまりよろしくないがbinding データを保存
        el.bindingvalue = binding;

        //v-modelの場所の情報を取得
        for (dir in vnode.data.directives) {
            if (vnode.data.directives[dir].name.toLowerCase() == "model") {
                let expression = vnode.data.directives[dir].expression.toString();
                let index = expression.indexOf(".");
                if (index == -1) {
                    el.modelvalue = expression;
                } else {
                    el.modelvalue = expression.substring(index + 1);
                }
                break;
            }
        }
        el.setAttribute("modelvalue", el.modelvalue);

        //project.js の関数を呼んでいます(※必ずメインでincludeしておいてください <script src="./javascript/doracomponent.js"></script>)
        if (typeof Project.InitValidate == 'function') {
            Project.InitValidate(el, el.modelvalue);
        }

        if (typeof Project.SetControlCss == 'function') {
            let errorFlag = false;
            if (el.bindingvalue.value[el.modelvalue + '_IS_ERROR'] != null) {
                errorFlag = true;
            }

            Project.SetControlCss(el, el.bindingvalue, errorFlag);
        }

        let format = el.getAttribute("dora_format");
        if (format != null) {
            el.value = parseFormat(binding.value[el.modelvalue], format);
        }


        //コントロールがエラーかどうか確認

        el.isinputdata = function () {
            try {
                return el.inputflag;
            }
            catch (e) {
            };
            return false;
        };


        //エラーかどうか（外部より参照用）
        el.isinputerror = function () {
            try {
                if (el.bindingvalue.value[el.modelvalue + '_IS_ERROR'] == true) {
                    return true;
                }
            }
            catch (e) {
            };
            return false;
        };


        //外部から呼ばれる関数(v-on:change イベントと併用した場合 v-on:changeが実行されるので、先にcheckvalidateを実行する必要がある)
        el.checkvalidate = function (evt) {
            return el.event_change(evt);
        };

        //変更時のイベント
        el.event_input = function (evt) {
            el.inputflag = true;
        };
        el.addEventListener("input", el.event_input, false);

        //change イベント
        el.event_change = function (evt) {

            //二度実行防止(updateでfalseになります)
            if (el.onceflag == true) {
                return false;
            }

            el.onceflag = true;
            //el.removeEventListener("change", el.event_change, false);

            //フラグの更新
            let defultField = DoraConst.FIELD_UPDATE_FLAG;

            el.bindingvalue.value[defultField] = true;

            let message = '';
            //バインドデータの更新（日付などを正しい値にする）
            let format = el.getAttribute("dora_format");

            if (!(format == null || format.length == 0)) {
                if (el.value.length == 0) {
                    el.bindingvalue.value[el.modelvalue] = null;
                }
                else {
                    let retvalue = transformFormat(el.value, format);
                    //変換に失敗した場合
                    if (retvalue == null) {
                        message = '値が違います。';
                    }
                    //変換できないものはとりあえずnullをセットしておく
                    el.bindingvalue.value[el.modelvalue] = retvalue;
                }

            }

            if (message.length == 0) {
                //project.js の関数を呼んでいます(※必ずメインでincludeしておいてください <script src="./javascript/doracomponent.js"></script>)
                if (typeof Project.CheckValidate == 'function') {
                    message = Project.CheckValidate(el.modelvalue, el.bindingvalue.value[el.modelvalue]);
                }
            }

            delete el.bindingvalue.value[el.modelvalue + '_IS_ERROR'];
            delete el.bindingvalue.value[el.modelvalue + '_IS_ERROR_VALUE'];
            if (message.length > 0) {
                //フォーカスを戻す処理だけど、入れるとおかしくなるのでcssで対応
                el.bindingvalue.value[el.modelvalue + '_IS_ERROR'] = true;

                alert(message);
                evt.preventDefault();
                evt.stopPropagation();
                el.bindingvalue.value[el.modelvalue + '_IS_ERROR_VALUE'] = el.value;

                Vue.nextTick(
                    function () {
                        el.focus();
                    }
                );

                return false;
            }

            return true;
        };
        el.addEventListener("change", el.event_change, false);

        //フォーカス取得時イベント
        el.event_focus = function (evt) {
            let ae = evt.target;

            //こちらを入れないと選択状態にならない
            Vue.nextTick(
                function () {
                    if (ae != document.activeElement) {
                        return;
                    }

                    //v-dora_updateflag.bindingvaluedisp と定義している場合 バインディングの値をそのままセット
                    if (binding.modifiers.bindingvaluedisp == true && ae.bindingvalue.value[ae.modelvalue] != null) {
                        ae.value = ae.bindingvalue.value[ae.modelvalue]; //parseFormat(el.bindingvalue.value[el.modelvalue], format);
                    }
                    
                    if (typeof ae.select == 'function') {
                        //課題　ieはこちらでOK　chromeはsetTimeoutが必要 edgeはsetTimeoutを入れると処理によって無限ループになる
                        ae.select();

                        //chrome跡
                        //setTimeout(function () {
                        //    //if (ae == document.activeElement) { 
                        //    //}
                        //    ae.select();    
                        //}, 0);                        
                        
                                                
                    }
                }
            );


        };
        el.addEventListener("focus", el.event_focus, false);

        el.event_blur = null;
        //modelをそのまま表示している場合はフォーカス喪失時に再度フォーマット
        if (binding.modifiers.bindingvaluedisp == true) {

            //フォーカス喪失時のイベント
            el.event_blur = function (evt) {
                let ae = evt.target;
                //if (typeof ae.select == 'function') {
                //    //選択解除
                //    try {
                //        ae.selectionStart = 0;
                //        ae.selectionEnd = 0;
                //    } catch (e) { }
                //}

                let format = ae.getAttribute("dora_format");

                if (format == null || format.length == 0) {
                    return;
                }

                if (ae.bindingvalue.value[ae.modelvalue] != null) {
                    if (binding.modifiers.bindingvaluedisp == true) {
                        ae.value = parseFormat(ae.bindingvalue.value[ae.modelvalue], format);
                    }
                }

            };
            el.addEventListener("blur", el.event_blur, false);
        }

    },

    update: function (el, binding, vnode) { //, oldValue) {

        el.onceflag = false;
        el.inputflag = false;

        //あまりよろしくないがbinding データを保存
        el.bindingvalue = binding;
        
        //if (el.modelvalue != null) {
        //    if (binding.value[el.modelvalue] == binding.oldValue[el.modelvalue]) {
        //        return;
        //    }
        //}

        let inputerrorflag = el.isinputerror();
        if (typeof Project.SetControlCss == 'function') {
            Project.SetControlCss(el, el.bindingvalue, inputerrorflag);
        }

        //エラーの場合エラー値をセット
        let errorValue = '';

        if (inputerrorflag) {
            errorValue = '' + el.bindingvalue.value[el.modelvalue + '_IS_ERROR_VALUE'];
            el.value = errorValue;
        }

        if (errorValue.length == 0) {
            //フォーマットの処理
            let format = el.getAttribute("dora_format");

            if (format == null || format.length == 0) {
                return;
            }

            if (binding.value[el.modelvalue] != null) {
                el.value = parseFormat(binding.value[el.modelvalue], format);
            }
        }
    },

    unbind: function (el) {
        el.removeEventListener("input", el.event_input, false);
        el.removeEventListener("change", el.event_change, false);
        el.removeEventListener("focus", el.event_focus, false);
        if (el.event_blur != null) {
            el.removeEventListener("blur", el.event_blur, false);
        }
    }
    ,

});

//コンボボックス
//値を変更したい場合functionを作成 selectvaluetest(elem.name)
//コンボボックスの値が変わらないものについては v-dora_selectitems.once で速度はやくなります。
//v-dora_selectitems
Vue.directive('dora_selectitems', {
    //データ更新時にフラグを追加
    bind: function (el, binding, vnode) {

        let options = el.options;
        options.length = 0;
        //for (var i = options.length - 1; 0 <= i; --i) {
        //    el.remove(i);
        //}

        let blanktext = el.getAttribute("dora_blanktext");

        //存在しない場合は無視(修正した場合updateにコピー)
        if (blanktext != null) {
            let op = document.createElement("option");
            op.value = '';
            op.text = blanktext;
            el.appendChild(op);
        }

        //連想配列をループ処理で値を取り出してセレクトボックスにセットする
        for (let i = 0; i < binding.value.length; i++) {
            let op = document.createElement("option");
            op.value = binding.value[i].value;  //value値
            op.text = binding.value[i].text;   //テキスト値
            el.appendChild(op);
        }

    },
    update: function (el, binding, vnode) { //(el, binding, vnode) {

        let optionLength = el.options.length;
        let blanktext = el.getAttribute("dora_blanktext");

        if (blanktext != null) {
            optionLength--;
        }

        //値が変更にならないもの
        if (optionLength > 0 && binding.modifiers.once == true) {
            return;
        }


        if (binding.value.length == optionLength) {
            //if (binding.value.length == binding.oldValue.length) {
            if (JSON.stringify(binding.value) == JSON.stringify(binding.oldValue)) {
                return;
            }
            //}
        }

        let options = el.options;
        options.length = 0;

        //for (let i = options.length - 1; 0 <= i; --i) {
        //    el.remove(i);
        //}

        //存在しない場合は無視(修正した場合updateにコピー)
        if (blanktext != null) {
            let op = document.createElement("option");
            op.value = '';
            op.text = blanktext;
            el.appendChild(op);
        }

        //連想配列をループ処理で値を取り出してセレクトボックスにセットする
        for (let i = 0; i < binding.value.length; i++) {
            let op = document.createElement("option");
            op.value = binding.value[i].value;  //value値
            op.text = binding.value[i].text;   //テキスト値
            el.appendChild(op);
        }

    }
});

//フォーマット
Vue.filter('formatdelimiter', function (value, formatvalue) {
    return parseFormat(value, formatvalue);
});

Vue.component('dora-vscroll', {
    props:
    {
        //連結するオブジェクト
        dora_bind_items: {
            type: Array,
            default: []
        },
        //連結するdivタグ
        dora_bind_div: {
            type: String,
        }
        ,
        //行の高さ（1つでも高さが変わるデータが存在したら正しく表示されない）
        dora_height: {
            type: Number,
            default: 20
        },

    }
    ,
    data: function () {
        return {
            //ダミーのdivの高さ
            heightcalc: 0,
            //タイトルの高さ
            heighttitle: 0,
            //データの位置
            currentindex: 0,
            //tableのElement
            tableelement: null,
            //現状のElement
            vscrollelement: null,

            //現在表示されている行数（自動計算）
            datasize: 0,

            //スクロールイベントが連続で実行されない制御で使用
            timerflag: false,
            scrolltimer: null,

        }
    }
    ,
    mounted: function () {
        this.tableelement = document.getElementById(this.dora_bind_div);
        this.vscrollelement = this.tableelement.parentElement.querySelector("[vscroll='']");

        if (this.vscrollelement == null) {
            //e100に意味はありません(ソース検索用)
            alert('開発エラー[e100]');
        }

        let self = this;

        //上下キー（エンターキー（最終項目））イベント
        this.tableelement.addEventListener("keydown",
            function (evt) {
                //改行は最終行のみ対応
                if (evt.keyCode == 13 || evt.keyCode == 38 || evt.keyCode == 40 ) {

                    let objActive = document.activeElement;
                    if (objActive == null || objActive.type == null) {
                        return;
                    }
                    let objActiveType = objActive.type.toLowerCase();

                    //判定微妙かも
                    if (objActiveType == "textarea") {
                        return;
                    }
                    else if (evt.keyCode != 13 && objActiveType.indexOf("select") == 0) {
                        return;
                    }

                    let parentTD = objActive;
                    let findFlag = false;

                    //td（親）を求める3は少し適当
                    for (let i = 1; i < 3; i++) {
                        parentTD = parentTD.parentNode;
                        if (parentTD != null && parentTD.tagName.toLowerCase() == "td") {
                            findFlag = true;
                            break;
                        }
                    }

                    let findIndexTR = -1;
                    let listArrayTRlength = -1;

                    //最後の項目で改行
                    let lastEnterFlag = false;
                    //親にtdが存在した場合
                    if (findFlag == true) {

                        //tdのindexを求める
                        let parentTR = parentTD.parentNode;
                        

                        //trのindexを求める
                        let listArrayTR = parentTR.parentNode.querySelectorAll('tr');
                        listArrayTRlength = listArrayTR.length;
                        for (let i = 0; i < listArrayTR.length; i++) {
                            let obj = listArrayTR[i];
                            if (parentTR == obj) {
                                findIndexTR = i;
                                break;
                            }
                        }

                        if (evt.keyCode == 13) {
                            let listArrayTD = parentTR.querySelectorAll('td');

                            if (parentTD == listArrayTD[listArrayTD.length - 1]) {
                                lastEnterFlag = true;
                            }
                        }


                    }

                    //見つかった場合
                    let moveIndex = 0;
                    if (findIndexTR != -1) {

                        if ((evt.keyCode == 38) && (findIndexTR == 0)) {      //上
                            moveIndex = -1;
                        }
                        else if ((evt.keyCode == 40) && ((listArrayTRlength - 1) == findIndexTR)) {       //下
                            moveIndex = 1;
                        }
                        else if ((lastEnterFlag) && ((listArrayTRlength - 1) == findIndexTR)) {       //エンターキーで一番最後の項目
                            moveIndex = 1;
                        }

                        if (moveIndex != 0) {
                            movefunction(moveIndex, lastEnterFlag);
                        }
                    }

                }
            }
        );

        //ホイールマウスのイベント
        let mouseWheelEvent =
            function (evt) {
                let objActive = document.activeElement;
                if (objActive == null || objActive.type == null) {
                    return;
                }

                let objActiveType = objActive.type.toLowerCase();

                if (objActiveType == "textarea") {
                    return;
                }
                else if (objActiveType.indexOf("select") == 0) {
                    return;
                }

                let moveIndex = 0;
                
                if ((evt.wheelDelta || evt.detail) > 0) {
                    //上方向
                    moveIndex = -1;
                }
                else {
                    //下方向
                    moveIndex = 1;
                }

                movefunction(moveIndex, false);
            }

        //マルチブラウザ対応（どちらかにヒットするはず・・）
        this.tableelement.addEventListener('DOMMouseScroll', mouseWheelEvent);
        this.tableelement.addEventListener('mousewheel', mouseWheelEvent);

        //上下キー、ホイール共通処理
        let movefunction =
            function (moveIndex, enterFlag) {

            if (moveIndex < 0) {
                //上に移動
                if (self.currentindex == 0) {
                    moveIndex = 0;
                }
            }
            else if (moveIndex > 0) {
                //下に移動
                if (self.getLastDataIndex() <= self.currentindex) {
                    moveIndex = 0;
                }
            }

            if (moveIndex != 0) {
                self.scrollobject =
                    {
                        moveIndex: moveIndex,
                        enterFlag: enterFlag,
                    };

                self.execscroll(moveIndex, enterFlag);
            }

        };

        //画面をリサイズした場合に表示数を変更
        window.addEventListener("resize",
            function () {
                self.getData(true);
                //強制アップデート
                self.$forceUpdate();
            }
        );

    }
    ,
    template: '\
        <div class="" @scroll="scroll" vscroll="">\
            <div v-bind:style="{ height: heightcalc + \'px\'}">\
            </div>\
        </div>\
    '
    ,
    methods: {
        /**
         * 指定したページに移動する
         * @param {number} index 移動するデータのindex
         *        外から this.$refs.page.gotoindex する場合は mounted以降で呼び出し
         */
        gotoindex: function (index) {

            this.tableelement.scrollLeft = 0;

            let updownvalue = -1;
            if (index <= this.datasize) {
                index = 0;
            }
            else if (this.dora_bind_items != null && this.getLastDataIndex() < index) {
                //課題
                //最後のデータにエラーが発生した場合に、上キーで移動した場合、空欄になる（原因不明の不具合があったので）最後のデータは計算して出力するように変更
                index = this.getLastDataIndex();
                updownvalue = 1;
            }
            this.currentindex = index;
            this.getData(false, updownvalue);      
      
        }
        ,
        //スクロールイベント
        scroll: function () {
            this.execscroll(0,false);
        }
        ,
        //スクロール実処理
        execscroll: function (moveIndex, enterFlag) {

            let objActive = document.activeElement;

            let inputFlag = false;

            if (objActive.isinputdata) {

                if (typeof objActive.isinputdata == 'function') {
                    inputFlag = objActive.isinputdata();
                }

                if (inputFlag == false) {
                    if (moveIndex == 0) {
                        this.getData(true);
                        return;
                    }
                }

                //とりあえず、フォーカスを移動させてonchangeを実行させる
                objActive.blur();   //2018/11/17 時点ではedgeでは動作せず

                let self = this;
                let currentscrollTop = this.vscrollelement.scrollTop;
                setTimeout(function () {

                    //入力した場合のみ（一度エラーを表示した後は素通し）
                    if (inputFlag) {
                        if (typeof objActive.isinputerror == 'function') {
                            //エラーの場合
                            if (objActive.isinputerror()) {
                                self.getData(false);
                                //evt.preventDefault();
                                //evt.stopPropagation();
                                return;
                            }
                        }
                    }

                    let currentindexcalc = self.currentindex;
                    currentindexcalc += moveIndex;
                    if (currentindexcalc < 0) {
                        currentindexcalc = 0;
                    }
                    else if ((self.dora_bind_items.length - 1) < currentindexcalc) {
                        currentindexcalc = self.dora_bind_items.length - 1;
                    }

                    if (moveIndex == 0) {
                        self.getData(true);
                    }
                    else {
                        self.currentindex = currentindexcalc;
                        self.getData(false);
                    }
                    
                    Vue.nextTick(
                        function () {

                            if (enterFlag) {
                                let parentTD = objActive;
                                let findFlag = false;


                                //かなりfocus.jsと被るのでもったいない・・

                                //td（親）を求める3は少し適当
                                for (let i = 1; i < 3; i++) {
                                    parentTD = parentTD.parentNode;
                                    if (parentTD != null && parentTD.tagName.toLowerCase() == "td") {
                                        findFlag = true;
                                        break;
                                    }
                                }
                                if (findFlag == true) {
                                    let parentTR = parentTD.parentNode;

                                    let listArray = parentTR.querySelectorAll('input,textarea');

                                    //最初にフォーカスが移動できるコントロールに移動
                                    for (let i = 0; i < listArray.length; i++) {
                                        let obj = listArray[i];
                                        //let objType = obj.type.toLowerCase();

                                        //focusがセットできない場合は次
                                        if (obj.readOnly == true || obj.disabled == true) {
                                            continue;
                                        }
                                        objActive = obj;

                                        break;

                                    }
                                }
                            }

                            objActive.focus();
                            //if (typeof objActive.select == 'function') {
                            //    objActive.select();
                            //}

                        }
                    );

                }, 0);
            }
            else {
                this.getData(true);
            }

        }
        ,
        //テーブルの高さ
        getTableheight: function () {
            //return (this.vscrollelement.scrollHeight - this.heighttitle);
            return (this.heightcalc - this.heighttitle);
        }
        ,
        //最終表示用INDEX（一番下までデータを表示させない） ※10件データがあって、3件画面表示できる場合は　7を戻す(7件目から3つのデータを表示)
        getLastDataIndex: function () {
            return (this.dora_bind_items.length - this.datasize);
        }
        ,
        getData: function (scrollflag,argsupdownvalue) {
            this.heightcalc = this.heighttitle + (this.dora_bind_items.length * this.dora_height);

            let updownvalue = 0;
            let currentvalue = 0;

            if (scrollflag) {
                if (this.timerflag == false) {
                    //現在のデータ位置を計算
                    currentvalue = this.currentindex;
                    this.currentindex = Math.round((this.vscrollelement.scrollTop / this.getTableheight()) * (this.dora_bind_items.length));

                    updownvalue = this.currentindex - currentvalue;
                }
            }
            else {
                //キーボード系の移動はスクロールを修正
                currentvalue = this.vscrollelement.scrollTop;
                let scrollvalue = 0;

                if (this.currentindex == 0) {
                    scrollvalue = 0;
                }
                else if (this.currentindex > this.dora_bind_items.length-1) {
                    scrollvalue = this.heightcalc; //this.vscrollelement.scrollHeight;
                }
                else {
                    scrollvalue = Math.round(((this.currentindex + 1) / (this.dora_bind_items.length)) * this.getTableheight());
                }

                
                this.vscrollelement.scrollTop = scrollvalue;

                //こちらのイベント発生後 連続で発生させないようにする
                this.timerflag = true;

                if (this.scrolltimer != null) {
                    clearTimeout(this.scrolltimer);
                }

                let self = this;
                this.scrolltimer = setTimeout(function () {
                    self.timerflag = false;
                }, 500);

                updownvalue = scrollvalue - currentvalue;

            }

            this.datasize = Math.round((this.tableelement.clientHeight - this.heighttitle ) / this.dora_height);

            if (this.datasize < 1) {
                this.datasize = 1;
            }

            //親に通知
            this.$emit('input', this.dora_bind_items.slice(this.currentindex, this.currentindex + this.datasize));

            //置き換える
            if (argsupdownvalue!=null){
                updownvalue = argsupdownvalue;
            }

            //if (updownvalue != 0) {
            //上に移動
            if (updownvalue < 0 || this.currentindex == 0) {
                let self = this;
                if (self.tableelement.scrollTop != 0) {
                    Vue.nextTick(
                        function () {
                            self.tableelement.scrollTop = 0;
                        }
                    );
                }
            }
            else if (updownvalue > 0 || (this.getLastDataIndex() <= this.currentindex)) {
                //下に移動
                let self = this;
                if (self.tableelement.scrollTop != self.tableelement.clientHeight) {
                    Vue.nextTick(
                        function () {
                            self.tableelement.scrollTop = self.tableelement.clientHeight;
                        }
                    );
                }
            }
            //}
        }
    }
    ,
    watch: {
        dora_bind_items: function (value) {
            if (this.dora_bind_items == null || this.dora_bind_items.length == 0) {
                this.heightcalc = 0;

                //let elInput = document.getElementById(this.dora_bind_div);
                this.tableelement.scrollTop = 0;
                this.tableelement.scrollLeft = 0;
                this.vscrollelement.scrollTop = 0;


            }
            else {
                //タイトル部分の取得
                if (this.heighttitle == 0) {

                    try {
                        let trArray = this.tableelement.querySelector('thead').querySelectorAll('tr');

                        if (trArray != null) {
                            for (let i = 0; i < trArray.length; i++) {
                                this.heighttitle += +(trArray[i].clientHeight);
                            }
                        }
                    }
                    catch (e) { }
                }

                /* 行の高さ確認用
                try {
                    let trArray = this.tableelement.querySelector('tbody').querySelector('tr');
    
                    if (trArray != null) {
                        console.log(trArray.clientHeight);
                    }
                }
                catch (e) { }
                */
            }

            this.getData(true);
        }
    }
});

//https://kuroeveryday.blogspot.com/2017/10/pagination-with-vue2.html 参考
Vue.component('dora-paging', {
    props:
    {
        // 現在のページ番号
        /*
        currentPage: {
            type: Number,
            default: -1
        },
        */
        // 1ページに表示するアイテムの上限（0にすると全件表示） ※ページング表示もなし
        dora_size: {
            type: Number,
            default: 20
        },
        // ページネーションに表示するページ数の上限
        dora_page_range: {
            type: Number,
            default: 10
        },
        //連結するオブジェクト
        dora_bind_items: {
            type: Array,
            default: []
        },
        //連結するdivタグ
        dora_bind_div: {
            type: String,
        }
        ,
        //pc版の場合、検索後条件パネルを非表示にする場合使用
        dora_display_panel: {
            type: Boolean,
            default: false
        }
        ,
    }
    ,
    //componentの変数は関数化する必要あり
    //https://jp.vuejs.org/v2/guide/components.html
    data: function () {
        return {
            currentPage: -1,
        }
    }
    ,
    template: '\
<div class="" >\
  <nav v-show="isShow" class="pagination is-centered" role="navigation" aria-label="pagination">\
        <a @click="first" class="pagination-previous" href="#">&laquo;</a>\
        <a @click="prev" class="pagination-previous" href="#">&lt;</a>\
        <a @click="next" class="pagination-next" href="#">&gt;</a>\
        <a @click="last" class="pagination-next" href="#">&raquo;</a>\
      \
      <ul class="pagination-list">\
          <li v-for="i in displayPageRange" class="page-item" >\
            <a @click="gotopage(i)" :class="{\'pagination-link\':true,\'is-current\':(i-1) === currentPage}" href="#">{{ i }}</a>\
          </li>\
      </ul>\
      \
  </nav>\
</div>\
        '
    ,
    computed: {
        /**
         * ページ数を取得する
         * @return {number} 総ページ数(1はじまり)
         */
        pages: function () {
            return Math.ceil(this.dora_bind_items.length / this.dora_size);
        },
        /**
         * ページネーションで表示するページ番号の範囲を取得する
         * @return {Array<number>} ページ番号の配列
         */
        displayPageRange: function () {

            const half = Math.ceil(this.dora_page_range / 2);
            let start, end;

            if (this.pages < this.dora_page_range) {
                // ページネーションのrangeよりページ数がすくない場合
                start = 1;
                end = this.pages;

            } else if (this.currentPage < half) {
                // 左端のページ番号が1になったとき
                start = 1;
                end = start + this.dora_page_range - 1;

            } else if (this.pages - half < this.currentPage) {
                // 右端のページ番号が総ページ数になったとき
                end = this.pages;
                start = end - this.dora_page_range + 1;

            } else {
                // activeページを中央にする
                start = this.currentPage - half + 1;
                end = this.currentPage + half;
            }

            let indexes = [];
            for (let i = start; i <= end; i++) {
                indexes.push(i);
            }
            return indexes;
        },

        isShow: function () {
            //全件の場合
            if (this.dora_size == 0) {
                return false;
            }
            if (this.dora_bind_items == null || this.dora_bind_items.length == 0) {
                return false;
            }
            return true;
        }

    },
    methods: {
        /**
         * ページ先頭に移動する
         */
        first: function () {
            this.currentPage = 0;
            this.selectHandler(true);
        },
        /**
         * ページ後尾に移動する
         */
        last: function () {
            this.currentPage = this.pages - 1;
            this.selectHandler(true);
        },
        /**
         * 1ページ前に移動する
         */
        prev: function () {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.selectHandler(true);
            }
        },
        /**
         * 1ページ次に移動する
         */
        next: function () {
            if (this.currentPage < this.pages - 1) {
                this.currentPage++;
                this.selectHandler(true);
            }
        },
        /**
         * 指定したページに移動する
         * @param {number} index ページ番号
         * 戻り値 データが存在する場合:true
         *        外から this.$refs.page.gotopage する場合は mounted以降で呼び出し
         */
        gotopage: function (index) {
            this.currentPage = index - 1;
            this.selectHandler(true);
        },
        /**
         * ページを変更したときの処理
         */
        selectHandler: function (scrollflag) {

            if (scrollflag == true) {
                //スクロールをtopにする
                if (this.dora_bind_div != null) {
                    let bindDiv = this.dora_bind_div.split(',');

                    for (let i in bindDiv) {
                        document.getElementById(bindDiv[i]).scrollTop = 0;
                        document.getElementById(bindDiv[i]).scrollLeft = 0;
                    }
                }
            }

            if (this.dora_size == 0) {
                //全件
                this.$emit('input', this.dora_bind_items);
            }
            else {
                let head = this.currentPage * this.dora_size;
                //親に通知
                this.$emit('input', this.dora_bind_items.slice(head, head + this.dora_size));
            }

        }

    }
    ,
    watch: {
        dora_bind_items: function (value) {
            if (this.dora_bind_items == null || this.dora_bind_items.length == 0) {
                this.currentPage = -1;
            }

            if (this.currentPage == -1 && this.dora_bind_items.length > 0) {
                this.currentPage = 0;
            }

            //こちらの場合スクロールを行わない
            this.selectHandler(false);

            //親はこのように指定
            //v-bind:dora_display_panel.sync="isDisplayWherePanel"
            if (value && value.length != 0) {
                //条件パネルを非表示
                this.$emit('update:dora_display_panel', false);
            }
            else {
                //条件パネルを表示
                this.$emit('update:dora_display_panel', true);
            }
        }
    }
    ,
});

var FORMATTYPES = {
    none: 0,
    zero: 1,
    currency: 2,
    date: 3,
    parcent: 4
}

//小数点
var DECIMAL_SEPARATOR = ".";
//通貨区切り
var THOUSANDS_SEPARATOR = ",";

function getFormatType(formatString) {
    let formattype = FORMATTYPES.none;

    if (formatString.length > 0) {
        if (formatString.substr(0, 2) == "00") { //if (formatString.startsWith("00")) {                              //特別処理 zeroformat  1 → 0000001   ※parseのほうで同じ処理をしているので注意！
            formattype = FORMATTYPES.zero;
        }
        else if (formatString.substr(-1, 1) == "%") { //if (formatString.endsWith("%")) {      /* パーセント系*/
            formattype = FORMATTYPES.parcent;
        }
        else if (formatString.indexOf(",") != -1 || formatString.indexOf(".") != -1 || formatString.indexOf("#") != -1) { //if (formatString.includes(",") || formatString.includes(".") || formatString.includes("#")) {      /*数値系*/
            formattype = FORMATTYPES.currency;
        }
        else if (formatString.indexOf("/") != -1 || formatString.indexOf(":") != -1) {  //if (formatString.includes("/") || formatString.includes(":")) {      /*日付系*/
            formattype = FORMATTYPES.date;
        }
    }
    return formattype;
}

/**
* 値(DB)→表示(html)変換
* @param value
* @param formatString
*/
function parseFormat(value, formatString) {

    if (value == null) {
        return null;
    }

    //値をそのまま戻す
    if (formatString == null || formatString.length == 0 || value.toString().length == 0) {
        return value;
    }

    let formattype = getFormatType(formatString);

    if (formattype == FORMATTYPES.none) {
        return value;
    }

    let motoValue = value;
    value = value.toString();
    if (formattype == FORMATTYPES.parcent) {
        formatString = formatString.replace("%", "");
        value = value.replace("%", "");
    }

    switch (formattype) {
        case FORMATTYPES.zero:
            if (value.length > 0 && value.length != formatString.length) {

                value = (formatString + value).toString();
                value = value.substr(value.length - formatString.length);

            }

            break;
        case FORMATTYPES.currency:
        case FORMATTYPES.parcent:
            //value = value.replace(new RegExp(THOUSANDS_SEPARATOR, 'g'), "");
            let errorFlag = false;

            //整数と小数にわける
            //let [seisu, shosu = ""] = value.split(DECIMAL_SEPARATOR);
            let sep = value.split(DECIMAL_SEPARATOR);
            let seisu = sep[0];
            let shosu = "";
            if (sep.length > 1) {
                shosu = sep[1];
            }

            //let [seisuformat, shosuformat = ""] = formatString.split(DECIMAL_SEPARATOR);
            sep = formatString.split(DECIMAL_SEPARATOR);
            let seisuformat = sep[0];
            let shosuformat = "";
            if (sep.length > 1) {
                shosuformat = sep[1];
            }

            //1 → 100 にする
            if (formattype == FORMATTYPES.parcent && seisu.length > 0) {

                shosu += "000";
                shosu = shosu.substr(0, 2) + DECIMAL_SEPARATOR + shosu.substr(2);
                value = seisu + shosu;


                //[seisu, shosu = ""] = value.split(DECIMAL_SEPARATOR);
                sep = value.split(DECIMAL_SEPARATOR);
                seisu = sep[0];
                shosu = "";
                if (sep.length > 1) {
                    shosu = sep[1];
                }

                let seisuAny = seisu;
                if (isNaN(seisuAny) == true) {
                    errorFlag = true;
                }
                else {
                    seisu = parseInt(seisu).toString();
                }
            }


            if (seisuformat.indexOf(THOUSANDS_SEPARATOR) != -1) {
                seisu = seisu.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);       //カンマ区切り

                if (value == "0" && seisuformat.substr(-1, 1) == "#") {
                    seisu = "";
                }
            }

            if (shosuformat.length > 0) {
                shosu = shosu + shosuformat;
                shosu = DECIMAL_SEPARATOR + shosu.substring(0, shosuformat.length);
            }
            else {
                shosu = "";
            }

            let valueAny = value;

            if (errorFlag == true || isNaN(valueAny) == true) {
                value = motoValue;      //元の値をセット
            }
            else {
                value = seisu + shosu;

                if (formattype == FORMATTYPES.parcent) {
                    if (value.length > 0 && value.substr(-1, 1) != "%") {
                        value += "%";
                    }
                }
            }
            break;
        case FORMATTYPES.date:
            //console.log("transform:" + value);
            if (value.length != 0) {
                let dateValue = new Date("" + changeDateValue(value));
                if (dateValue == null || isNaN(+dateValue)) {
                    //value = "";
                }
                else {

                    value = formatString;
                    let year = dateValue.getFullYear().toString();
                    let month = (dateValue.getMonth() + 1).toString();
                    let day = dateValue.getDate().toString();

                    let hour = dateValue.getHours().toString();
                    let minute = dateValue.getMinutes().toString();
                    let second = dateValue.getSeconds().toString()


                    value = value.replace("yyyy", year);
                    value = value.replace("yy", year.substr(2));

                    value = value.replace("MM", month.length == 1 ? "0" + month : month);
                    value = value.replace("M", month);

                    value = value.replace("dd", day.length == 1 ? "0" + day : day);
                    value = value.replace("d", day);

                    value = value.replace("HH", hour.length == 1 ? "0" + hour : hour);
                    value = value.replace("H", hour);

                    value = value.replace("mm", minute.length == 1 ? "0" + minute : minute);
                    value = value.replace("mm", minute);

                    value = value.replace("ss", second.length == 1 ? "0" + second : second);
                    value = value.replace("ss", second);

                }
            }
            break;
    }

    return value;

}

/**
* 表示(html)→値(DB)変換
* @param value
* @param formatString
*/
function transformFormat(value, formatString) {

    if (value == null) {
        return null;
    }

    //値をそのまま戻す
    if (formatString == null || formatString.length == 0 || value.toString().length == 0) {
        return value;
    }

    let formattype = getFormatType(formatString);

    if (formattype == FORMATTYPES.none) {
        return value;
    }

    let motoValue = value;
    value = value.toString();
    if (formattype == FORMATTYPES.parcent) {
        formatString = formatString.replace("%", "");
        value = value.replace("%", "");
    }

    switch (formattype) {
        case FORMATTYPES.zero:
            if (value.length > 0 && value.length != formatString.length) {

                value = (formatString + value).toString();
                value = value.substr(value.length - formatString.length);

            }

            break;
        case FORMATTYPES.currency:
        case FORMATTYPES.parcent:
            value = value.replace(new RegExp(THOUSANDS_SEPARATOR, 'g'), "");

            //整数と小数にわける
            //let [seisu, shosu = ""] = value.split(DECIMAL_SEPARATOR);
            let sep = value.split(DECIMAL_SEPARATOR);
            let seisu = sep[0];
            let shosu = "";
            if (sep.length > 1) {
                shosu = sep[1];
            }

            //let [seisuformat, shosuformat = ""] = formatString.split(DECIMAL_SEPARATOR);
            sep = formatString.split(DECIMAL_SEPARATOR);
            let seisuformat = sep[0];
            let shosuformat = "";
            if (sep.length > 1) {
                shosuformat = sep[1];
            }

            if (shosuformat.length > 0) {
                shosu = shosu + shosuformat;
                shosu = shosu.substring(0, shosuformat.length)
                shosu = DECIMAL_SEPARATOR + shosu;
            }
            else {
                shosu = "";
            }

            //00 が0にならないため
            if (+seisu ==0 ){
                seisu =0;
            }
            value = seisu + shosu;

            if (isNaN(value) == true) {
                value = null;    //数値でない
            }
            else {
                if (formattype == FORMATTYPES.parcent) {
                    //100% → 1にする

                    shosu = shosu.replace(DECIMAL_SEPARATOR, "");

                    let zerostr = "";
                    for (let i = 0; i < (3 - seisu.length); i++) {
                        zerostr += "0";
                    }

                    value = zerostr + seisu;
                    value = value.substr(0, value.length - 2) + DECIMAL_SEPARATOR + value.substr(-2);

                    value = value + shosu;

                    //let valueAny = value;
                    //if (isNaN(valueAny) == false) {
                    //    value = parseFloat(value).toString();
                    //}
                    //else {
                    //    value = null;
                    //}

                }
            }
            break;

        case FORMATTYPES.date:
            if (value.length != 0) {

                let dateValue = new Date("" + changeDateValue(value));

                if (dateValue == null || isNaN(+dateValue)) {
                    value = null;
                }
                else {
                    value = "yyyy/MM/dd HH:mm:ss";

                    let year = dateValue.getFullYear().toString();
                    let month = (dateValue.getMonth() + 1).toString();
                    let day = dateValue.getDate().toString();

                    let hour = dateValue.getHours().toString();
                    let minute = dateValue.getMinutes().toString();
                    let second = dateValue.getSeconds().toString()


                    value = value.replace("yyyy", year);
                    value = value.replace("yy", year.substr(2));

                    value = value.replace("MM", month.length == 1 ? "0" + month : month);
                    value = value.replace("M", month);

                    value = value.replace("dd", day.length == 1 ? "0" + day : day);
                    value = value.replace("d", day);

                    value = value.replace("HH", hour.length == 1 ? "0" + hour : hour);
                    value = value.replace("H", hour);

                    value = value.replace("mm", minute.length == 1 ? "0" + minute : minute);
                    value = value.replace("mm", minute);

                    value = value.replace("ss", second.length == 1 ? "0" + second : second);
                    value = value.replace("ss", second);

                }
            }

            break;
    }

    return value;
}


function changeDateValue(value) {

    let reg = new RegExp("[^\\:\\/\\s0-9]");
    //変な文字を含んでいたら終了
    if (value.match(reg)) {
        return null;
    }

    //let [datestring, timestring = ""] = value.split(" ");
    let sep = value.split(" ");
    let datestring = sep[0];
    let timestring = "";
    if (sep.length > 1) {
        timestring = sep[1];
    }

    let nowDateTime = new Date();

    //年・月・日・曜日を取得する
    let year = nowDateTime.getFullYear().toString();
    let month = (nowDateTime.getMonth() + 1).toString();
    //var week = nowDateTime.getDay().toString();
    let day = nowDateTime.getDate().toString();

    let hour = "0";//= nowDateTime.getHours().toString();
    let minute = "0";// = nowDateTime.getMinutes().toString();
    let second = "0";//= nowDateTime.getSeconds().toString();

    //時刻のみ
    if (value.indexOf(":") != -1 && timestring.length == 0) {
        year = "1900";
        month = "1";
        day = "1";
        timestring = datestring;
        datestring = "";
    }


    if (datestring.length > 0) {
        let arr = datestring.split("/");

        if (arr.length == 2) {
            if (arr[0].length == 4) {   //4桁の場合は　年/月とみなす
                year = arr[0];
                month = arr[1];
                day = "1";
            }
            else {      //こちらは　月、日とみなす
                month = arr[0];
                day = arr[1];
            }
        }
        else if (arr.length == 3) {      //年月日入っている場合
            if (arr[0].length == 2) {
                year = year.substring(0, 2) + arr[0];
            }
            else {
                year = arr[0];
            }

            month = arr[1];
            day = arr[2];
        }
        else {
            return null;
        }
    }

    if (timestring.length > 0) {
        let arr = timestring.split(":");
        if (arr.length == 2) {
            hour = arr[0];
            minute = arr[1];
            second = "0";
        }
        else if (arr.length == 3) {
            hour = arr[0];
            minute = arr[1];
            second = arr[2];

        }
        else {
            return null;
        }
    }

    nowDateTime = new Date(year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second);

    //時刻型かどうかの確認
    if (parseInt(nowDateTime.getFullYear()) != parseInt(year)) {
        return null;
    }

    if (parseInt(nowDateTime.getMonth() + 1) != parseInt(month)) {
        return null;
    }

    if (parseInt(nowDateTime.getDate()) != parseInt(day)) {
        return null;
    }

    if (parseInt(nowDateTime.getHours()) != parseInt(hour)) {
        return null;
    }

    if (parseInt(nowDateTime.getMinutes()) != parseInt(minute)) {
        return null;
    }

    if (parseInt(nowDateTime.getSeconds()) != parseInt(second)) {
        return null;
    }


    return nowDateTime;

}

