//バリデーションのチェックを入れる配列
var validatefield = [];

/**
 * 現在のページかどうか判定する
 * @param {el} エレメント
 * @param {field} フィールド名
*/
function ValidateInit(el, field) {
    if (validatefield[field] == null) {
        let obj = {};

        //独自でタグを追加
        // < <input ～ isHankaku="true" />
        //半角
        if (el.getAttribute("isHankaku") != null) {
            obj.isHankaku = Boolean(el.getAttribute("isHankaku"));
        }

        //数値(0-9)
        if (el.getAttribute("isNumeric") != null) {
            obj.isNumeric = Boolean(el.getAttribute("isNumeric"));
        }

        //全角
        if (el.getAttribute("isZenkaku") != null) {
            obj.isZenkaku = Boolean(el.getAttribute("isZenkaku"));
        }

        //文字数チェックFrom
        if (el.getAttribute("maxLengthFrom") != null) {
            obj.maxLengthFrom = +el.getAttribute("maxLengthFrom");
        }

        //文字数チェックTo
        if (el.getAttribute("maxLengthTo") != null) {
            obj.maxLengthTo = +el.getAttribute("maxLengthTo");
        }

        /*
        //バイト数チェックFrom
        if (el.getAttribute("maxByteLengthFrom") != null) {
            obj.maxByteLengthFrom = +el.getAttribute("maxByteLengthFrom");
        }

        //バイト数チェックTo
        if (el.getAttribute("maxByteLengthTo") != null) {
            obj.maxByteLengthTo = +el.getAttribute("maxByteLengthTo");
        }
        */

        validatefield[field] = obj;
    }
}

/**
 * エラーチェック
 * @param {field} フィールド名
 * @param {value} チェック値
 * @return　{string} エラーメッセージ
*/
function ValidateCheck(field, value) {
    if (value == null || value.length == 0) {
        return "";
    }


    if (validatefield[field] != null) {
        //半角
        if (validatefield[field].isHankaku == true) {
            if (value.match(/^[0-9a-zA-Z]+$/) == null) {
                return "半角ではありません。";
            }
        }

        //数値(0-9)
        if (validatefield[field].isNumeric == true) {
            if (value.match(/^[0-9]+$/) == null) {
                return "数値ではありません。";
            }
        }

        //全角
        if (validatefield[field].isZenkaku == true) {
            if (value.match(/^[^\x01-\x7E\xA1-\xDF]+$/) == null) {
                return "全角ではありません。";
            }
        }

        //文字数チェックFrom
        if (validatefield[field].maxLengthFrom != null) {
            if (value.length < +validatefield[field].maxLengthFrom) {
                return validatefield[field].maxLengthFrom + "文字以下の入力はできません。";
            }
        }

        //文字数チェックTo
        if (validatefield[field].maxLengthTo != null) {
            if (value.length > +validatefield[field].maxLengthTo) {
                return validatefield[field].maxLengthTo + "文字以上の入力はできません。";
            }
        }

        /*
        //バイト数チェックFrom
        if (validatefield[field].maxByteLengthFrom != null) {
            if (GetbyteLength(value) < +validatefield[field].maxByteLengthFrom) {
                return validatefield[field].maxByteLengthFrom + "文字以下の入力はできません。";
            }
        }

        //バイトチェックTo
        if (validatefield[field].maxByteLengthTo != null) {
            if (GetbyteLength(value) > +validatefield[field].maxByteLengthTo) {
                return validatefield[field].maxByteLengthTo + "文字以上の入力はできません。";
            }
        }
        */
    }

    return "";
}


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
};