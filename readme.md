■概要
Vue.js を使った（表形式）サンプルです。
（
サンプルで1000件程度のデータを確認することが出来ますが
（サクサクとまではいきませんが）レスポンスよく動いていると思います。
）

作者はasp.netの利用が多いのですが
業務アプリは徐々にwebAPI+JavaScriptフレームワークが主流となってきております。
Vue.jsで業務アプリ風なものをチャレンジしてみました。
※デザインはあまり得意でないので、アドバイス頂ければと思います。

nugetやnpm等は一切利用せず
シンプルな作りを目指してみました。
（
個人的な感想なのですが、nugetやnpmのサンプルは関連コンポーネントの変化で
動かなくなったときの調査が大変ですので
業務アプリはシンプルな作りのほうがよいと思いましてこのような形にしています。
）

また、日本仕様に特化していまして
言語対応（英語切替）等は一切考慮していません。

■使用コンポーネント
Vue.js v2.5.17 （json⇔htmlコンポーネントのバインド、値のフォーマットなどで使用）
https://jp.vuejs.org/index.html

bulma.io v0.7.1（レスポンシブデザインを考慮）
https://bulma.io/

以下コンポーネントを利用しなかった理由
angular(JavaScriptフレームワーク)→ちょっと古い
angular2(JavaScriptフレームワーク)→複雑すぎ（学習コストが高い？）
react(JavaScriptフレームワーク)→2waybindが弱い？
bootstrap(css)→bulmaのほうが軽い。業務アプリはbulmaで充分？
jquery(java)→vui.jsと微妙に相性が悪い？（現状はjavascriptのみで結構いける？？）
typescript(java支援)→一つ学習コストが増える（一人で作るのであれば採用していたと思います）

■サンプル（とりあえず）

index.htmlを起動してください。
オンラインサンプル
https://kaerugit.github.io/VuejsTableInput

メニューが下になるほど、記述が簡易的になるのですが
オレオレクラス(doracomponent.js)の依存度が高まる為
あまりお勧めはできませんが
ソース記述の内容がわかる方であれば、利用して頂ければと思います。

（少し言い訳ですが（笑））IE11にも対応するため
javascriptの記述方法は一昔前の方法となっております。

■ファイル内容
└css
bulma.min.css（デザイン）
project.css（各種プロジェクト用で変更）
└javascript
doracomponent.js（効率化するための各種オブジェクト（クラス））
focus.js（エンターキーで項目移動（もしかしたらほかのプロジェクトで使えるかもしれません））
project.js（各種プロジェクト用で追加・変更可　一部doracomponent.js から呼ばれています）
vue.js(vueコンポーネント)
(ルート)
○○.html 各種サンプル

※別途アイコン表示に
https://bulma.io/documentation/elements/icon を使用


■オレオレクラス(doracomponent.js 名称にdora_をつけています)の簡易説明

Vue.directive
・dora_table
テーブルタグの全幅をセット
（こちらを使用せず、素の記述でも良いと思います）

・dora_updateflag
テキストボックスのフォーマット（dora_format プロパティと連動）、バリデーションなどを処理

・dora_selectitems
コンボボックスの選択値を簡略化するために使用
（こちらを使用せず、素の記述でも良いと思います）

Vue.filter
・dora_formatDelimiter
フォーマット用

Vue.component
・dora-paging
ページング用コンポーネント

■サンプルソースについて
v- がついているものは Vue.js コンポーネント（v-doraを除く）
var vm = new Vue({　の内容については Vue.jsのホームページを熟読をおすすめ

v-dora or dora がついているものはオレオレクラス(doracomponent.js)
css については基本 bulma 拡張部分は projecgt.css に記述（使用場所は文字列検索）

■社員マスタ(shainmaster.html)仕様

◇仕様
新規入力のみ社員コード入力可（既存行は主キー項目の為変更不可）
必須入力：社員コード、社員名
その他チェック：都道府県を入力した場合は市区町村CDが必須

◇サンプルの個別処理

サンプルでは後で処理しやすいように
固定項目を追加しています

IDENTITY_ID：連番を付与
NEW_FLAG：新規データ=true
UPDATE_FLAG：更新データ=true（dora_updateflag内で処理）
DELETE_FLAG：画面に表示
ERROR_FLAG：エラー行=true(先頭に表示)

○○_ISERROR　エラー項目の判定で使用

◇バリデーション（エラーチェック）
project.js（IsSubmitValidateError）で処理
(表形式を考慮した場合)
エラー項目の下にメッセージなどを表示すると
デザインが崩れる為
エラーには全てjavascript:alert('') を使用
⇒複数件エラーがあっても、1件ずつ表示

◇サンプルのバリデーション
※必要であればバリデーションを独自で追加

タグ（勝手に決めたオリジナル）を記述
ishankakuタグ 半角のみ
isnumericタグ 数値のみ
iszenkakuタグ 全角のみ
minlengthvalueタグ 文字数Min
maxlengthvalueタグ 文字数Max
minvalueタグ 最大値チェックMin(金額などで使用)
maxvalueタグ 最大値チェックMax(金額などで使用)

自動的に formatが日付型の場合、日付チェックしています。（金額なども同様）
（dora_updateflag directive）

～～その他（おまけ？）～～
textalignタグ ('right' or 'center')
isimeタグ IMEモード(true or false)
isprimarykeyタグ 新規入力は入力可（既存行は入力不可）の処理
※フォーマットはdora_formatタグ

タグ例（ime=off、入力位置はcenter、半角入力（全角不可）で5文字まで）
<input v-model.lazy="elem.社員コード" class="input" isime="false" ishankaku="true" maxlengthvalue="5" textalign="center" />
⇒textalign="center"、isime="false"は cssに直接書くのがレスポンス的にもよいと思います。

◇クラスの使用
jsonはclassと連動して使うのがよいのですが
本サンプルでは全く使用せず
全てのオブジェクトを
v-for でセットし配列(json)で処理しています。
（こうすることで一覧入力、単票入力の記述が統一化されます）

◇サーバ処理について
（本サンプルにはありませんが）
jsonをサーバに送信後処理としまして
・新規データ（NEW_FLAG=true）の重複エラー
・削除データ（DELETE_FLAG=trueの削除）
・新規データ・更新データをDBに登録
などの処理が必要と思われます。
（
json送信後のサーバ処理は
得意な言語(ruby java .net(core))でよいとおもいます
）

■レスポンシブ対応

◇
サンプルの中で少しごちゃごちゃしていますが
スマホ用のデザインも考慮しています。
⇒ブラウザの幅を狭くすると確認可
基本的な考えとしましては
PCは一画面（表はスクロール）
スマホは縦スクロールありとして
デザインしています。

※個人的には
page01.html
page01_mobile.html
とhtmlを分けて、同じjsをインクルードするのがベストだと思います。

◇
buluma.min.css と project.cssが混在しているので
サンプルとしてはわかりにくいと思います。

■javascriptについて
統一性があまりありません。
（サンプルとしてはよくないと思います）

■Vue.jsの感想・課題

◇
directiveなどを追加(doracomponent.js)し効率化していますが
基本的には何も使わず、素の状態で使うのがおすすめです。
（拡張すればするほど、レスポンスが悪くなっていきます・・）

◇
サンプルではhtmlでid指定していませんが
id指定がないとfocus移動などの処理が
とてもややこしくなります。

◇
tableの中にselect(プルダウン)を置くと
table内の値が更新される都度
select(プルダウン)の中身が再作成される
（都道府県コンボボックスでデータがセットされるととても遅くなります）