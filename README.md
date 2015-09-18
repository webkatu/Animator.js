# Animator.js


非同期処理のアニメーションを管理しながら実行できる。  
<a href="http://webkatu.com/sample/Animator.js/demo.html" target="_blank">Demo</a>


## 使い方

var animator = new Animator(element)

例
```
var animator = new Animator(document.body);
animator.hide().show({duration: '3s'});
animator.hide();
```

非同期処理を内部で管理し、一つのアニメーションが終わってから次のアニメーションが実行される。


## メソッド

### animator.show(transition, async)  

### animator.hide(transition, async)  

show/hideはアニメーションにtransitionを使っている。  
asyncにtrueを指定するとすぐ実行され、まだ実行されていないアニメーションは実行されなくなる。

```
animator.hide().show({
	duration: '3s',
	timingFunction: 'ease-in',
	delay: '0',
}).hide().show();
```
```
animator.hide({duration: '2s'}).show().hide().show().hide();

//1秒後、消えている途中にも関わらず表示する;
//上のhide({duration: '2s'})以降は実行されなくなる;
setTimeout(function() {
	animator.show(null, true);
}, 1000);
```

### animator.wait(MilliSecond)

```
animator.wait(2000).hide().wait(1000).show().wait(1000).hide();
```

### animator.animate(callback, async)

callbackが実行される。  
callbackの引数にはanimatorとprocessIdとnextが渡される。processIdについては後述。  
nextは関数。nextを呼び出すと次のアニメーションが実行される。  
nextを呼び出さない場合、次のアニメーションはいつまでも実行されない。  
asyncにtrueを指定するとすぐ実行される。  

```
animator.hide().show().animate(function(animator, processId, next) {
	setTimeout(function() {
		console.log('Hello');
		next();
	}, 2000);
}).hide();
```

### animator.init()
非同期処理の管理を初期化する。  
アニメーションが何らかの理由で失敗したり、nextが呼び出されなかったりして、続きのアニメーションが実行されない時などに使える。  

```
animator.animate(function(animator, processId, next) {});
animator.hide(); //上のanimateメソッドでnextを呼び出していないため実行されない;
animator.init();
animator.wait(2000).hide(); //実行されるようになる;
```

## プロパティ

### animator.element
### animator.css
### animator.originalCSS
### animator.defaultTransition
```
animator.defaultTransition = {
	duration: '3s',
	timingFunction: 'ease-in',
	delay: '1s';
}
animator.hide().show();
```
### animator.promise
### animator.processId
アニメーションが実行される度にprocessIdが変わる。  
割り込みで他のアニメーションが実行されたかどうかをこのプロパティで確かめられる。  
```
animator.animate(function(animator, processId, next) {
	setTimeout(function() {
		if(processId !== animator.processId) {
			console.log('割り込みあり');
			return;
		}
		console.log('割り込みなし');
		next();
	}, 2000);
});
animator.animate(function(){}, true);
```