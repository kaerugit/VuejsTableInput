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
            let thArray = theadArray[0].querySelectorAll('th');

            let width = 0;
            for (let i = 0; i < thArray.length; i++) {
                let currentWidth = parseInt(thArray[i].style.width);

                widthArray.push(currentWidth);
                width += currentWidth;  //obj.st.clientWidth;


            }
            //alert(width);
            el.style.width = width + 'px'; //clientWidth = width;


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
)

// v-dora_updateflag.bindingvaluedisp 指定でフォーカス取得時 バインディングの値をそのままセット
// v-dora_updateflag.bindingvaluedispをセットし、dora_format="#,###" とした場合、入力は 1000(modelの値) 表示は1,000 となる
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
            if (el.bindingvalue.value[el.modelvalue + '_ISERROR'] != null) {
                errorFlag = true;
            }

            Project.SetControlCss(el, el.bindingvalue, errorFlag);
        }

        let format = el.getAttribute("dora_format");
        if (format != null) {
            el.value = parseFormat(binding.value[el.modelvalue], format);
        }


        el.addEventListener("change",
            function (evt) {
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

                delete el.bindingvalue.value[el.modelvalue + '_ISERROR'];
                if (message.length > 0) {
                    //フォーカスを戻す処理だけど、入れるとおかしくなるのでcssで対応
                    el.bindingvalue.value[el.modelvalue + '_ISERROR'] = true;

                    alert(message);
                    evt.preventDefault();
                    evt.stopPropagation();
                    let nowValue = el.value;
                    //el.bindingvalue.value[el.modelvalue] = null;

                    setTimeout(
                            function () {
                                el.value = nowValue;
                                el.focus();
                            }
                        , 100)

                    return false;
                }

            }
            , false);

        //フォーカス取得時イベント
        el.addEventListener("focus",
            function (e) {
                let ae = e.target;


                //こちらを入れないと選択状態にならない
                Vue.nextTick(
                        function () {
                            if (ae != document.activeElement) {
                                return;
                            }

                            if (typeof ae.select == 'function') {
                                //v-dora_updateflag.bindingvaluedisp と定義している場合 バインディングの値をそのままセット
                                if (binding.modifiers.bindingvaluedisp == true && el.bindingvalue.value[el.modelvalue] != null) {
                                    ae.value = ae.bindingvalue.value[ae.modelvalue]; //parseFormat(el.bindingvalue.value[el.modelvalue], format);
                                }
                                el.select();

                                /*
                                try {
                                    el.selectionStart = 0;
                                    el.selectionEnd = el.value.length;
                                }
                                catch (e) { }
                                */
                            }
                        }
                );
            }
            , false);

        //modelをそのまま表示している場合はフォーカス喪失時に再度フォーマット
        if (binding.modifiers.bindingvaluedisp == true) {

            el.addEventListener("blur",
            function (e) {

                let ae = e.target;
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

            }
            , false);
        }

    },

    update: function (el, binding, vnode) { //, oldValue) {
        //あまりよろしくないがbinding データを保存
        el.bindingvalue = binding;

        if (typeof Project.SetControlCss == 'function') {
            let errorFlag = false;
            if (el.bindingvalue.value[el.modelvalue + '_ISERROR'] != null) {
                errorFlag = true;
            }

            Project.SetControlCss(el, el.bindingvalue, errorFlag);
        }

        //フォーマットの処理
        let format = el.getAttribute("dora_format");

        if (format == null || format.length == 0) {
            return;
        }

        if (binding.value[el.modelvalue] != null) {
            el.value = parseFormat(binding.value[el.modelvalue], format);
        }

    },

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
Vue.filter('dora_formatDelimiter', function (value, formatvalue) {
    return parseFormat(value, formatvalue);
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
            dora_bind_items: {
                type: Array,
                default: []
            },
            dora_bind_div: {
                type: String,
            }
            ,
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
            <a @click="pageSelect(i)" :class="{\'pagination-link\':true,\'is-current\':(i-1) === currentPage}" href="#">{{ i }}</a>\
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
         *        外から this.$refs.page.pageSelect する場合は mounted以降で呼び出し
         */
        pageSelect: function (index) {
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
                //条件パネルを非表
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

var DECIMAL_SEPARATOR = ".";
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

            value = seisu + shosu;

            if (isNaN(value) == true) {
                value = null;    //数値でない
            }
            else {
                if (formattype == FORMATTYPES.parcent) {
                    //100% → 1にする

                    shosu = shosu.replace(DECIMAL_SEPARATOR, "");

                    let zerostr = "";
                    for (let i = 0; i < (3 - seisu.length) ; i++) {
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

