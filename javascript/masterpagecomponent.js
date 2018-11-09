
Vue.component('master-page', {
    props:
        {
        }
    ,
    data: function () {
        return {
        }
    }
    ,
    template: '\
        <div class="columns">\
            <div class="column" style="margin-top:10px">\
                <span class="icon" onclick="window.top.location.href = \'index.html\';">\
                    <i class="fas fa-home"></i>\
                </span>\
                サンプルシステム（固定ページ）\
            </div>\
        </div>\
'
});

