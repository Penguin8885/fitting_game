var fgame = null;

function main(){
    next_game();
}
function start_game(){
    fgame.start_game();
}
function submit_answer(){
    fgame.submit_answer();
}
function next_game(){
    fgame = new FittingGame();
}

class FittingGame {
    /* コンストラクタ */
    constructor(){
        document.getElementById("start").className="waves-effect waves-light btn";
        document.getElementById("submit").className="waves-effect waves-light btn disabled";
        document.getElementById("answer").style.display="none";
        document.getElementById("next").className="waves-effect waves-light btn disabled";
        document.getElementById("slider2").style.display="none";
        document.getElementById("slider3").style.display="none";
        document.getElementById("slider4").style.display="none";
        document.getElementById("loss_value").innerHTML = 0;
        document.getElementById("operation_count").innerHTML = 0;

        /* sliderのイベントリスナーの登録 */
        var react_range_changing = function(elem, pointer){
            return function(evt){
                pointer.update_param();
            };
        };
        var elem = document.getElementById('param_range1');
        elem.addEventListener('input', react_range_changing(elem, this));
        var elem = document.getElementById('param_range2');
        elem.addEventListener('input', react_range_changing(elem, this));
        var elem = document.getElementById('param_range3');
        elem.addEventListener('input', react_range_changing(elem, this));
        var elem = document.getElementById('param_range4');
        elem.addEventListener('input', react_range_changing(elem, this));

        this.p_module = new PointsModule();
        this.canvas = new GraphCanvas('canvas1', [0.44, 0.6]);
        this.canvas.draw_grid(1);
        this.operation_count = 0;
    }

    /* ゲーム開始ボタンを押した際に起動する関数 */
    start_game(){
        /* 各入力系の操作可能性の変更 */
        document.getElementById("start").className="waves-effect waves-light btn disabled";
        document.getElementById("submit").className="waves-effect waves-light btn";

        /* レベルの選択に関する処理 */
        var level = 1;  // easyがデフォルトで選択されているものとする
        if (document.getElementById('level_normal').checked){
            level = 2;
            document.getElementById("slider2").style.display="block";
        }
        if (document.getElementById('level_hard').checked){
            level = 3;
            document.getElementById("slider2").style.display="block";
            document.getElementById("slider3").style.display="block";
            document.getElementById("slider4").style.display="block";
        }

        /* 真の関数を生成 */
        this.param_true = this.get_function_param(level);
        this.func_true = this.get_function(this.param_true);

        /* 推測した関数の式を生成，スライダーに反映 */
        this.param_tilde = this.get_function_param(level);
        this.func_tilde = this.get_function(this.param_tilde);
        document.getElementById("param_range1").value = this.param_tilde[0];
        if(this.param_tilde.length >= 2){
            document.getElementById("param_range2").value = this.param_tilde[1];
        }
        if(this.param_tilde.length > 3){
            document.getElementById("param_range3").value = this.param_tilde[2];
            document.getElementById("param_range4").value = this.param_tilde[3];
        }

        /* 真の関数からノイズありのサンプル点を生成 */
        this.sample_points = this.p_module.get_sample_points(this.func_true, this.canvas.x_min, this.canvas.x_max, 1, 10);

        /* キャンバス上で関数の描画 */
        this.drawCanvas();
    }

    /* ゲーム完了ボタンを押した際に起動する関数 */
    submit_answer(){
        /* 各入力系の操作可能性の変更 */
        document.getElementById("submit").className="waves-effect waves-light btn disabled";
        document.getElementById("answer").style.display="block";
        document.getElementById("next").className="waves-effect waves-light btn";

        /* 答え合わせ, 真のグラフを表示 */
        var points_true = this.p_module.get_points(this.func_true, this.canvas.x_min, this.canvas.x_max);
        this.canvas.plot(points_true, 'rgb(0, 255, 0)');

        var flag = true;
        for(var i = 0; i < this.param_true.length; i++){
            if(this.param_true[i] != this.param_tilde[i]){
                flag = false;
                break;
            }
        }
        if(flag == true){
            document.getElementById("result").innerHTML = "結果：成功";
            document.getElementById("evaluation").innerHTML = "ピッタリですね";
            console.log("True");
        }
        else{
            console.log("dames")
        }
    }

    /* 関数のパラメータを取得するための関数 */
    get_function_param(level){
        /* レベルに応じてパラメータ数を決定 */
        var param_num = 0;
        if(level == 3){
            param_num = 4;
        }else{
            param_num = level;
        }

        /* パラメータを一様分布で生成 */
        var param = new Array(param_num);
        for(var i = 0; i < param.length; i++){
            param[i] = Math.round(this.p_module.get_random_uniform(-5, 5));
        }
        return param;
    }

    /* 関数のパラメータから関数本体を取得するための関数 */
    get_function(param){
        if(param.length == 1){
            return (function(x){return 0.1*x**2 + param[0]});
        }else if(param.length == 2){
            return (function(x){return 0.01*x**3 + 0.1*param[1]*x**2 + param[0]});
        }else if(param.length == 4){
            return (function(x){return 0.01*param[2]*x**3 + 0.1*param[1]*x**2 + param[0]});
        }
    }

    /* キャンバスに関数とそのサンプル点を描画する関数 */
    drawCanvas(){
        /* キャンバスリセット */
        this.canvas.clear_canvas();
        this.canvas.draw_grid(1);

        /* 推測関数とサンプル点を描画 */
        var points_tilde = this.p_module.get_points(this.func_tilde, this.canvas.x_min, this.canvas.x_max);
        this.canvas.plot(points_tilde, 'rgb(255, 0, 0)');
        this.canvas.scatter(this.sample_points, 'rgb(0, 0, 255)');

        /* 損失関数の値を更新 */
        this.update_loss();
    }

    /* 関数のパラメータを更新する関数(イベントリスナーに登録して使用) */
    update_param(){
        if(document.getElementById("submit").className != "waves-effect waves-light btn"){
            return; // ゲーム開始前や終了後はなにもしない
        }

        /* 推測関数の更新 */
        this.param_tilde[0] = Number(document.getElementById('param_range1').value);
        if(this.param_tilde.length >= 2){
            this.param_tilde[1] = Number(document.getElementById('param_range2').value);
        }
        if(this.param_tilde.length > 3){
            this.param_tilde[2] = Number(document.getElementById('param_range3').value);
            this.param_tilde[3] = Number(document.getElementById('param_range4').value);
        }
        this.func_tilde = this.get_function(this.param_tilde); // 関数更新

        /* 更新回数のカウント */
        this.operation_count = Number(this.operation_count) + 1;
        document.getElementById("operation_count").innerHTML = this.operation_count;

        /* 更新回数が一定以上になった場合は強制終了 */
        if(this.operation_count >= 30){
            this.submit_answer();
            return;
        }

        /* キャンバスの描画 */
        this.drawCanvas();
    }

    /* 平均二乗誤差を計算し，出力する関数 */
    update_loss(){
        var loss = 0;
        for(var i = 0; i < this.sample_points.length; i++){
            loss += (this.sample_points[1][i] - this.func_tilde(this.sample_points[0][i]))**2 / this.sample_points.length;
        }
        document.getElementById("loss_value").innerHTML = Math.round(loss * 10) / 10;
    }
}

class PointsModule {
    /* コンストラクタ */
    constructor(){}

    /* 関数のノイズなしサンプリング */
    get_points(func, x_min, x_max){
        /* 等間隔の値の配列を返却する関数 */
        var linspace = function(min, max, num){
            var x = new Array(num);
            var delta = (max - min) / (num - 1);
            for(var i = 0; i < num; i++){
                x[i] = min + delta*i;
            }
            return x;
        };

        /* 関数値の計算 */
        var x = linspace(x_min, x_max, 50);
        var y = new Array(x.length);
        for(var i = 0; i < x.length; i++){
            y[i] = func(x[i]);
        }

        return [x, y]; // 座標点を返却
    }

    /* 関数のノイズありサンプリング */
    get_sample_points(func, x_min, x_max, y_sigma, num){
        var x = new Array(num);
        var y = new Array(num);
        for(var i = 0; i < num; i++){
            x[i] = this.get_random_uniform(x_min, x_max);
            y[i] = func(x[i]) + this.get_random_normal(0, y_sigma);
        }
        return [x, y]; // 座標点を返却
    }

    /* 一様分布乱数の生成関数 */
    get_random_uniform(min, max){
        return (max - min) * Math.random() + min;
    }

    /* 正規分布乱数の生成関数 */
    get_random_normal(mu, sigma){
        var x = Math.random();
        var y = Math.random();
        var z = Math.sqrt(-2*Math.log(x))*Math.cos(2*Math.PI*y);
        return z*sigma + mu;
    }
}

class GraphCanvas {
    /* コンストラクタ */
    constructor(id, size) {
        /* キャンバスの情報登録 */
        this.id = id;       // HTML上のID
        this.size = size;   // キャンバスのサイズ(ウィンドウ比率)

        /* キャンバスの本体取得 */
        this.canvas = document.getElementById(id);
        if(!this.canvas || !this.canvas.getContext){
            console.log('error : can not load canvas; @GraphCanvas->constructor');
        }

        /* キャンバスコンテキスト取得 */
        this.context = this.canvas.getContext('2d');

        /* ウィンドウのリサイズ時処理の登録 */
        this.set_canvas_resizer(this.id, this.size);

        /* キャンバス画面クリア */
        this.clear_canvas();

        /* キャンバスのデフォルトの描画設定 */
        this.set_xlim(-10, 10);
        this.set_ylim(-10, 10);
    }

    /* キャンバスをクリアする関数 */
    clear_canvas(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /* ウィンドウのリサイズ時処理を登録するための関数 */
    set_canvas_resizer(id, size){
        var canvas_resize = function (){
            document.getElementById(id).setAttribute('width', window.innerWidth*size[0]);
            document.getElementById(id).setAttribute('height', window.innerHeight*size[1]);
        };
        window.addEventListener('resize', canvas_resize, false);
        canvas_resize();
    }

    /* x軸の描画範囲を設定する関数 */
    set_xlim(min, max){
        this.x_min = min;
        this.x_max = max;
    }

    /* y軸の描画範囲を設定する関数 */
    set_ylim(min, max){
        this.y_min = min;
        this.y_max = max;
    }

    /* 座標系を画像座標に変換する関数 */
    transform_coordinate(points){
        var x = new Array(points[0].length); // 座標変換後の値格納用
        var y = new Array(points[0].length); // 座標変換後の値格納用
        for(var i = 0; i < points[0].length; i++){
            /* 注意 式が間違っています．バグあり */
            x[i] = ((this.x_max + this.x_min) / 2) + points[0][i];
            x[i] *= this.canvas.width / (this.x_max - this.x_min);
            x[i] += this.canvas.width / 2;
            y[i] = ((this.y_max + this.y_min) / 2) - points[1][i];
            y[i] *= this.canvas.height / (this.y_max - this.y_min);
            y[i] += this.canvas.height / 2;
        }
        return [x, y];
    }

    /* グリッド線(間隔1)を引く関数 */
    draw_grid(interval){
        var drawLine = function(points, context){
            context.beginPath();
            context.strokeStyle = 'rgb(200,200,200)';
            context.moveTo(points[0][0], points[1][0]);
            context.lineTo(points[0][1], points[1][1]);
            context.stroke();
        };

        var tx = 0; // 線を引くx座標
        while(tx < this.x_max){
            var points = [[tx, tx], [this.y_min, this.y_max]]; // 線の始点と終点
            points = this.transform_coordinate(points);        // 座標変換
            drawLine(points, this.context);                    // 線を引く
            tx += interval;                                    // 設定間隔分進む
        }
        var tx = -interval; // 線を引くx座標
        while(tx > this.x_min){
            var points = [[tx, tx], [this.y_min, this.y_max]]; // 線の始点と終点
            points = this.transform_coordinate(points);        // 座標変換
            drawLine(points, this.context);                    // 線を引く
            tx -= interval;                                    // 設定間隔分戻る
        }

        var ty = 0; // 線を引くy座標
        while(ty < this.y_max){
            var points = [[this.x_min, this.x_max], [ty, ty]]; // 線の始点と終点
            points = this.transform_coordinate(points);        // 座標変換
            drawLine(points, this.context);                    // 線を引く
            ty += interval;                                    // 設定間隔分進む
        }
        var ty = -interval; // 線を引くy座標
        while(ty > this.y_min){
            var points = [[this.x_min, this.x_max], [ty, ty]]; // 線の始点と終点
            points = this.transform_coordinate(points);        // 座標変換
            drawLine(points, this.context);                    // 線を引く
            ty -= interval;                                    // 設定間隔分戻る
        }
    }

    /* 線グラフを描画する関数 */
    plot(points, color){
        /* 座標系を画像座標系に変換 */
        var cpoints = this.transform_coordinate(points);

        /* キャンバスに線グラフを描画 */
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.moveTo(cpoints[0][0], cpoints[1][0]);     // 1点目を打つ
        for(var i = 1; i < cpoints[0].length; i++){
            this.context.lineTo(cpoints[0][i], cpoints[1][i]); // i点目に向けて線を引く
        }
        this.context.stroke();
    }

    /* 散布図を描画する関数 */
    scatter(points, color){
        /* 座標系を画像座標系に変換 */
        var cpoints = this.transform_coordinate(points);

        /* 点を描画する関数(マーカー形状の定義) */
        var drawCrossDot = function(x, y, size, color, context){
            context.beginPath();
            context.strokeStyle = color;
            context.moveTo(x-size/2, y-size/2);
            context.lineTo(x+size/2, y+size/2);
            context.stroke();
            context.moveTo(x-size/2, y+size/2);
            context.lineTo(x+size/2, y-size/2);
            context.stroke();
        }

        /* キャンバスに散布図を描画 */
        for(var i = 0; i < cpoints[0].length; i++){
            drawCrossDot(cpoints[0][i], cpoints[1][i], 10, color, this.context);
        }
    }
}









