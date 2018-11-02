'use strict';

//インテリジェンスで表示させたいため使用
var Project = {};

//プロジェクトカスタマイズ用javascript

//バリデーションのチェックを入れる配列
var validatefield = [];

/*
★こちらのバリデーションの課題
同じ画面で同じv-model（v-model.lazy="elem.社員コード"）で複数存在する場合、先に読み込まれたものが優先となる
⇒同じv-model（v-model.lazy="elem.社員コード"）には同じチェックを入れること
<input v-model.lazy="elem.社員コード" v-dora_updateflag="elem" class="input" />
<input v-model.lazy="elem.社員コード" v-dora_updateflag="elem" class="input" isime="false" ishankaku="true" maxlengthvalue="5" textalign="center" />

*/


/**
 * バリデーション初期処理(doracomponent.jsから呼び出し)
 * @param {el} エレメント
 * @param {field} フィールド名
*/
Project.InitValidate = function(el, field) {
    //formatをセットすることも可能
    //el.setAttribute("dora_format","#,###");

    //サンプルでは速度優先の為tagで判定していますが
    //大規模開発は項目で統一したほうがよいので
    //設定用のjsonなどで処理したほうがよいかもしれません

    //設定用のjson例（ただし設定のjsonの件数が増えれば増えるほど速度低下していくと思われます）
    //[
    //{field:社員コード,ishankaku:true,isime:false},
    //{field:入社日,format:'yyyy/MM/dd'},
    //]

    if (validatefield[field] == null) {
        let obj = {};

        //formatを取得
        if (el.getAttribute("dora_format") != null) {
            obj.format = el.getAttribute("dora_format");
        }

        //■■以下直接 cssに記述する事おすすめ■■
        if (obj.format != null) {
            obj.isime = false;  //formatが入っているものは強制OFF
        }
        else{
            if (el.getAttribute("isime") != null) {
                obj.isime = isBoolean(el.getAttribute("isime"));
            }
        }
        //テキストの位置
        if (el.getAttribute("textalign") != null) {
            obj.textalign = el.getAttribute("textalign");
        }
        else {
            //formatで勝手に判断
            if (obj.format != null) {
                let formattype = getFormatType(obj.format);
                if (formattype == FORMATTYPES.parcent || formattype == FORMATTYPES.currency) {
                    obj.textalign = "right";
                }
                else if (formattype == FORMATTYPES.zero || formattype == FORMATTYPES.date) {
                    obj.textalign = "center";
                }
            }
        }
        //■■以下直接 cssに記述する事おすすめ(終)■■


        //以下バリデーション

        //プロジェクト独自なチェックが必要な場合　オリジナルなタグを用意し、処理を追加
        // < <input ～ isHankaku="true" />

        //半角
        if (el.getAttribute("ishankaku") != null) {
            obj.isHankaku = isBoolean(el.getAttribute("ishankaku"));
        }

        //数値(0-9)
        if (el.getAttribute("isnumeric") != null) {
            obj.isNumeric = isBoolean(el.getAttribute("isnumeric"));
        }

        //全角
        if (el.getAttribute("iszenkaku") != null) {
            obj.isZenkaku = isBoolean(el.getAttribute("iszenkaku"));
        }

        //文字数チェックMin
        if (el.getAttribute("minlengthvalue") != null) {
            obj.minlength = +el.getAttribute("minlengthvalue");
        }

        //文字数チェックMax(maxlengthはhtmlとかぶるので注意)
        if (el.getAttribute("maxlengthvalue") != null) {
            obj.maxlength = +el.getAttribute("maxlengthvalue");
        }

        /*
        //バイト数チェックMin
        if (el.getAttribute("minbytelengthvalue") != null) {
            obj.minbytelength = +el.getAttribute("minbytelengthvalue");
        }

        //バイト数チェックMax
        if (el.getAttribute("maxbytelengthvalue") != null) {
            obj.maxbytelength = +el.getAttribute("maxbytelengthvalue");
        }
        */

        //最大値チェックMin
        if (el.getAttribute("minvalue") != null) {
            obj.minvalue = +el.getAttribute("minvalue");
        }

        //最大値チェックMax
        if (el.getAttribute("maxvalue") != null) {
            obj.maxvalue = +el.getAttribute("maxvalue");
        }

        validatefield[field] = obj;
    }


    //■■以下直接 cssに記述する事おすすめ■■ をコメントにした場合以下必要なし

    //imeの処理
    if (validatefield[field] != null) {
        let obj = validatefield[field];
        if (obj.isime != null ) {
            if (obj.isime == true) {
                //含まれていなければ追加
                el.classList.toggle("ime-on");
            }
            else {
                //含まれていなければ追加
                el.classList.toggle("ime-off");
            }
        }

        if (obj.textalign != null) {
            if (obj.textalign.toLocaleLowerCase() == "center") {
                el.classList.toggle("text-center");
            }
            else if (obj.textalign.toLocaleLowerCase() == "right") {
                el.classList.toggle("text-right");
            }
        }
    }

}

/**
 * エラーチェック(doracomponent.jsから呼び出し)
 * @param {field} フィールド名
 * @param {value} チェック値
 * @return　{string} エラーメッセージ
*/
Project.CheckValidate = function (field, value) {
    if (value == null || value.length == 0) {
        return "";
    }

    if (validatefield[field] != null) {
        let obj = validatefield[field];

        //半角
        if (obj.isHankaku == true) {
            if (value.match(/^[0-9a-zA-Z]+$/) == null) {
                return "半角ではありません。";
            }
        }

        //数値(0-9)
        if (obj.isNumeric == true) {
            if (value.match(/^[0-9]+$/) == null) {
                return "数値ではありません。";
            }
        }

        //全角
        if (obj.isZenkaku == true) {
            if (value.match(/^[^\x01-\x7E\xA1-\xDF]+$/) == null) {
                return "全角ではありません。";
            }
        }

        //文字数チェックMin
        if (obj.minlength != null) {
            if (value.length < +obj.minlength) {
                return +obj.minlength - 1 + "文字以下の入力はできません。";
            }
        }

        //文字数チェックMax
        if (obj.maxlength != null) {
            if (value.length > +obj.maxlength) {
                return +obj.maxlength+1 + "文字以上の入力はできません。";
            }
        }

        /*
        //バイト数チェックMin
        if (obj.minbytelength != null) {
            if (GetbyteLength(value) < +obj.minbytelength) {
                return obj.minbytelength + "文字未満の入力はできません。";
            }
        }

        //バイトチェックMax
        if (obj.maxbytelength != null) {
            if (GetbyteLength(value) > +obj.maxbytelength) {
                return obj.maxbytelength + "文字超過の入力はできません。";
            }
        }
        */

        //値チェックMin
        if (obj.minvalue != null) {
            if (+value < +obj.minvalue) {
                let formatValue = obj.minvalue;
                if (obj.format) {
                    formatValue = parseFormat(formatValue, obj.format);
                }

                return formatValue + "未満の入力はできません。";
            }
        }

        //値チェックMax
        if (obj.maxvalue != null) {
            if (+value > +obj.maxvalue) {

                let formatValue = obj.maxvalue;
                if (obj.format) {
                    formatValue = parseFormat(formatValue, obj.format);
                }
                return formatValue + "超過の入力はできません。";
            }
        }

    }

    return "";
}

/**
 * コントロールのcssなどの変更(doracomponent.jsから呼び出し)
 * @param {el} エレメント
 * @param {binding} バインディング値
*/
Project.SetControlCss = function (el, binding, errorFlag) {

    //新規フラグでisprimarykey=trueの場合 コントロールを入力不可とする
    let primarykey = el.getAttribute("isprimarykey");
    if (primarykey != null) {
        el.disabled = false;
        if (String(true).toLocaleLowerCase() == primarykey.toString().toLocaleLowerCase()) {
            if (!(binding.value["NEW_FLAG"] == true)) {
                el.disabled = true;
            }
        }

        //必須の場合色をつける
        if (el.disabled == true) {
            el.classList.remove("primary-request");
        }
        else {
            el.classList.add("primary-request");
        }

    }

    if (errorFlag == true) {
        el.classList.add("err-control");
    }
    else{
        el.classList.remove("err-control");
    }

}

/**
 * submit時のエラーチェック
 * @param {items} バインド値
 * @param {keyFiled} 重複チェック用の項目
 * @param {requiredfield} 必須項目
 * @param {errorCheckFunction} 個別エラーfunction (必要なければnull)
 * @param {pageMoveFunction} ページ移動のfunction (必要なければnull) ※nullの場合は単票と判定する
*/
Project.IsSubmitValidateError = function (items, keyFiled, requiredfield, errorCheckFunction, pageMoveFunction) {

    let error = {
        ErrorIdentity: null,     //エラーフラグを付けるエラー行(サーバからのエラーで使用)
        Field: '',
        Message: '',
    };

    
    for (let i = 0; i < items.length; i++) {
        let item = items[i];

        //ERROR_FLAGをクリア
        item["ERROR_FLAG"] = false;
        item["IDENTITY_ID"] = i;           //サーバ処理でのエラー時にでも使用してください。


        //コントロールのエラーを一旦削除
        let keys = Object.keys(item);
        let findString = '_ISERROR';
        for (let j = keys.length - 1; 0 <= j; --j) {
            //if (keys[j].endsWith('_ISERROR')) IEでは使えないので・・
            let keystring = keys[j];

            if ((keystring.lastIndexOf(findString) + findString.length === keystring.length) && (findString.length <= keystring.length)) {
                delete item[keys[j]];
            }
        }


        //削除行かどうか
        let deleteFlag = false;

        //Deleteの場合は無視
        if (item["DELETE_FLAG"] == true) {
            deleteFlag = true;
        }

        /*
        if (requiredFlag == true) {
            if (item["NEW_FLAG"] == true) { //append: function () { でセット

                requiredFlag = false;
                for (let j = 0; j < requiredfield.length; j++) {
                    if (!(item[requiredfield[j]] == null || item[requiredfield[j]].toString().length == 0)) {
                        requiredFlag = true;
                        break;
                    }
                }

                if (requiredFlag == false) {
                    //更新フラグを取り下げ
                    item["UPDATE_FLAG"] = false;
                }
                else {
                    for (let j = 0; j < requiredfield.length; j++) {
                        if (item[requiredfield[j]] == null || item[requiredfield[j]].toString().length == 0) {
                            error = {
                                Field: requiredfield[j],
                                Message: '必須入力が入力されていません',
                            };
                        }
                    }
                }
            }

        }
        */

        //更新している行のみ (pageMoveFunction == null は単票画面)
        if (item["UPDATE_FLAG"] == true || pageMoveFunction == null) {

            if (deleteFlag == false && error.Message.length == 0) {
                for (let j = 0; j < requiredfield.length; j++) {
                    if (item[requiredfield[j]] == null || item[requiredfield[j]].toString().length == 0) {
                        error = {
                            Field: requiredfield[j],
                            Message: '必須入力が入力されていません',
                        };
                        break;
                    }
                }
            }

            //重複チェック
            if (deleteFlag == false && error.Message.length == 0) {
                //新規データが対象（既存行の重複チェックはしない）
                if (item["NEW_FLAG"] == true) {
                    if (keyFiled.length > 0) {
                        let dupeitems = items.filter(
                            function (dupeitem) {

                                if (dupeitem["IDENTITY_ID"] == item["IDENTITY_ID"]) {
                                    return false;
                                }

                                let findFlag = true;
                                for (let j = 0; j < keyFiled.length; j++) {
                                    if (dupeitem[keyFiled[j]] != item[keyFiled[j]]) {
                                        findFlag = false;
                                        break;
                                    }
                                }

                                return findFlag;
                            }
                        );

                        if (dupeitems.length > 0) {
                            error = {
                                Field: keyFiled[0],
                                Message: 'データが重複しています',
                            };
                        }

                    }
                }

            }

            //入力時エラーが、そのままの場合があるので、個別(桁数など)のチェックをもう一度行う
            if (deleteFlag == false && error.Message.length == 0) {
                for (var key in item) {
                    let message = Project.CheckValidate(key, item[key]);
                    if (message.length > 0) {
                        error = {
                            Field: key,
                            Message: message,
                        };
                    }
                }
            }

            //個別チェック
            if (deleteFlag == false && error.Message.length == 0) {
                if (typeof errorCheckFunction == 'function') {
                    errorCheckFunction(error, item);
                }
            }

        }
        if (error.Message.length > 0) {
            item["ERROR_FLAG"] = true;

            //エラーメッセージの表示
            Project.MoveErrorFocus(items, error, pageMoveFunction);

            return true;
        }

    }

    return false;
};

/**
 * エラー時のフォーカス移動
 * @param {items} バインド値
 * @param {error} エラーオブジェクト
 * @param {pageMoveFunction} ページ移動のfunction  ※nullの場合は単票と判定する
*/
Project.MoveErrorFocus = function (items, error, pageMoveFunction) {

    if (error.Message != null && error.Message.length > 0) {

        //error.ErrorIdentity がセットされている場合、ERROR_FLAGをtrueにする処理
        if (error.ErrorIdentity != null && error.ErrorIdentity.toString().length > 0) {
            let errorItems = items.filter(
                function (item) {

                    if (item["IDENTITY_ID"].toString() == error.ErrorIdentity.toString()) {
                        return true;
                    }
                    return false;
                }
            );

            for (var i = 0; i < errorItems.length; i++) {
                errorItems[i]["ERROR_FLAG"] = true;
            }

        }

        alert(error.Message);

        //エラー行を先頭にする
        items.sort(
            function (a, b) {

                //true 1 false 0 なので注意
                if (isBoolean(a["ERROR_FLAG"]) > isBoolean(b["ERROR_FLAG"])) { return -1; }
                else if (isBoolean(a["ERROR_FLAG"]) < isBoolean(b["ERROR_FLAG"])) { return 1; }

                if (a["IDENTITY_ID"] < b["IDENTITY_ID"]) { return -1; }
                else if (a["IDENTITY_ID"] > b["IDENTITY_ID"]) { return 1; }

                return 0;
            }
        );

        //ページを１ページにする
        //this.$refs.page.pageSelect(1);
        if (typeof pageMoveFunction == 'function') {
            pageMoveFunction();
        }


        if (error.Field.length > 0) {
            let errorItems = items.filter(
                function (item) {
                    return item["ERROR_FLAG"] == true;
                }
            );
            if (errorItems.length > 0) {
                //こちらの記述でエラーフィールドに色をセット
                errorItems[0][error.Field + '_ISERROR'] = true;
            }

            Vue.nextTick(
                function () {
                    let el;
                    if (pageMoveFunction != null) {
                        el = document.querySelector(".err-common");
                    }
                    else {
                        //単票用
                        el = document;
                    }

                    el = el.querySelector("[modelvalue='" + error.Field + "']");
                    if (el != null) {

                        el.focus();
                        if (typeof el.select == 'function') {
                            el.select();
                        }
                    }

                }
            );
        }

        return true;
    }
};

/**
 * くるくるの開始/終了
 * @param {loadingFlag} true：開始 false:終了
*/
Project.SetLoading = function (loadingFlag) {
    let divid = "divloading";
    if (loadingFlag) {
        let div = document.createElement('div');
        div.id = divid;
        div.innerHTML =
            "<div class=\"loader-bg\">" +
            "</div>" +
            "<div class=\"loader\">" +
            "</div>"
            ;
        document.body.appendChild(div);
    }
    else {
        let div = document.getElementById(divid);
        if (div != null) {
            document.body.removeChild(div);
        }
    }

};

/**
 * iframeダイアログを開く
 * @param {openHtmlPage} 開くページ
 * @param {returnFunc} 画面を戻った時に処理するfunction ※引数1つ（戻り値）
*/
Project.OpenDialog = function (openHtmlPage, args, returnFunc) {
    let wTop = window.top;

    let iframe = wTop.document.createElement("iframe");

    if (wTop.iframeManage == null) {
        wTop.iframeManage = [];
    }

    iframe.id = 'iframe' + wTop.iframeManage.length.toString();
    iframe.src = openHtmlPage;
    iframe.classList.add('iframeDialog');

    var element = wTop.document.body; //.querySelector("body");
    element.appendChild(iframe);

    //メインのスクロールを非表示にする(bulmaで定義されているので無理やり上書き)
    //こちらを記述しないとスクロールバーが2個並んでしまいます。
    //CloseDialogで強制的に削除。
    let head = wTop.document.getElementsByTagName('head')[0];
    let style = wTop.document.createElement("style");
    style.setAttribute("d", true);
    style.innerHTML = "html{overflow-y:hidden!important;/*javaで無理矢理追加*/}";
    head.appendChild(style);


    //自動的にディープコピー
    if (args != null) {
        args = JSON.parse(JSON.stringify(args));
    }

    let iframeObj = {
        Id: iframe.id,
        ReturnFunction: returnFunc,
        Args: args,
    }

    wTop.iframeManage.push(iframeObj);


};

Project.CloseDialog = function (returnValue) {
    let wTop = window.top;

    //最後のオブジェクト
    let iframeObj = wTop.iframeManage[wTop.iframeManage.length - 1];
    let iframeID = iframeObj.Id;

    if (returnValue != null) {
        if (iframeObj.ReturnFunction != null) {
            //自動的にディープコピー
            returnValue = JSON.parse(JSON.stringify(returnValue));
            iframeObj.ReturnFunction(returnValue);
        }
    }
    wTop.document.body.removeChild(wTop.document.getElementById(iframeID));

    //最後の配列を削除
    wTop.iframeManage.pop();

    if (wTop.iframeManage.length == 0) {

        //メインのスクロールを非表示にする(bulmaで定義されているので無理やり上書き) ⇒復活
        let head = wTop.document.getElementsByTagName('head')[0];

        let listArray = head.querySelectorAll("style");
        for (let i = listArray.length - 1; i >= 0; --i) {
            if (listArray[i].getAttribute("d") != null) {
                head.removeChild(listArray[i]);
            }
        }
    }

};

Project.GetDialogArgs = function () {
    let wTop = window.top;

    let args = wTop.iframeManage[wTop.iframeManage.length - 1].Args;

    //自動的にディープコピー
    if (args != null) {
        args = JSON.parse(JSON.stringify(args));
    }

    return args;

};

/**
 * 単票⇒一覧に戻ってきた場合の値のマージ
 * @param {items} バインド値
 * @param {updateData} 更新する値
 * @param {keyFiled} 主キーの項目（配列）
 * @param {pageMoveFunction} ページ移動のfunction (必要なければnull) ※nullの場合は単票と判定する
*/
Project.MargeInputData = function (items, updateData, keyFiled, pageMoveFunction) {

    //新規データの場合、先頭に追加
    if (updateData.NEW_FLAG == true) {
        items.unshift(updateData);

        if (typeof pageMoveFunction == 'function') {
            pageMoveFunction();
        }
    }
    else {
        if (keyFiled.length > 0) {
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let findFlag = true;

                for (let j = 0; j < keyFiled.length; j++) {
                    if (item[keyFiled[j]] != updateData[keyFiled[j]]) {
                        findFlag = false;
                        break;
                    }
                }

                if (findFlag == true) {
                    //自動的に変更されないので一旦削除してから追加する
                    items.splice(i, 1);
                    if (!(updateData.DELETE_FLAG == true)) {
                        items.splice(i, 0, updateData);
                    }
                    break;
                }

            }
        }
    }

    return items;
};

//https://zukucode.com/2017/04/javascript-string-length.html 参考
function GetbyteLength(value) {
    var length = 0;
    for (var i = 0; i < value.length; i++) {
        var c = value.charCodeAt(i);
        if ((c >= 0x0 && c < 0x81) || (c === 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) {
            length += 1;
        } else {
            length += 2;
        }
    }
    return length;
}

function isBoolean(value) {
    if (value != null && 
        String(true).toLocaleLowerCase() == value.toString().toLocaleLowerCase()) 
    {
        return  true;
    }
    else {
        return false;
    }

}
