var AnimationController = (function() {

	var AnimationController = function() {
		var self = this;

		//この配列に実行したいアニメーションなどのメソッドを追加していく;
		var queue = [];
		//キュー自体を識別するユニークなid;
		//キューが変えられたらidを変える;
		queue.id = new Object();
		//キューが空かどうかの真偽値を返す;
		queue.isEmpty = function() {
			return !Boolean(this.length);
		};
		//キューが動いているかどうかの真偽値;
		queue.busy = false;
		//キューを動かす(キューに入っているメソッドを実行していく);
		queue.run = function() {
			//既にキューが動いているなら終了;
			if(queue.busy) {
				return;
			}

			var id = queue.id;
			queue.busy = true;
			//キューを動かす処理.キューにデータが無くなるまで停止しない;
			(function _run() {
				//キューが変わっている(キューがclearされた)なら停止;
				if(id !== queue.id) {
					return;
				}
				//キューが空であれば停止する;
				if(queue.isEmpty()) {
					queue.busy = false;
					return;
				}

				//キューに入っているメソッドを実行.戻り値はミリ秒を期待している;
				var time = queue[0].method();
				time = Number(time) || 0;
				self.dequeue();
				//アニメーション終了後、次のメソッドを実行する;
				setTimeout(_run, time);
			})();
		};
		//キューにアニメーションなどのメソッドを追加する;
		this.enqueue = function(method) {
			if(typeof method !== 'function') {
				return this;
			}
			queue.push({
				method: method,
				//start: new Date().getTime(),
			});
			queue.run();
			return this;
		};
		//キューの先頭を消す;
		this.dequeue = function() {
			queue.shift();
			return this;
		};
		//キューの中のデータを全て消す;
		this.clear = function() {
			queue.length = 0;
			queue.id = new Object();
			queue.busy = false;
			return this;
		};
	};

	return AnimationController;
})();


var Animator = (function() {
	var Animator = function(element) {
		AnimationController.apply(this, null);

		//例外処理;
		if(arguments.length === 0) {
			throw (function() {
				var error = new TypeError();
				error.message = "Failed to construct 'Animator': 1 argument required, but only 0 present.";
				return error;
			})();
		}else if(!(element instanceof HTMLElement)) {
			throw (function() {
				var error = new TypeError();
				error.message = "Failed to construct 'Animator': Element must be provided.";
				return error;
			})();
		}
		var css = document.defaultView.getComputedStyle(element, null);
		var originalCSS = {
			opacity: css.opacity,
		};
		//プロパティを全て凍結;
		Object.defineProperties(this, {
			element: { value: element },
			css: { value: css },
			originalCSS: { value: originalCSS },
			defaultTransition: {
				value: {
					duration: '0.3s',
					timingFunction: '',
					delay: '0s',
				},
				enumerable: true,
				configurable: true,
				writable: true,
			},
			animationController: { value: new AnimationController() },
			//現在実行されている関数を識別する証明書;
			processId: {
				value: null,
				configurable: true,
				writable: true,
			},
		});
	};

	Animator.prototype = Object.create(AnimationController.prototype, {
		constructor: {
			value: AnimationController
		}
	});

	Animator.prototype.isDisplay = function() {
		if(this.css.display === 'none') {
			return false;
		}
		if(this.css.opacity !== this.originalCSS.opacity) {
			return false;
		}
		return true;
	};

	var getTransitionTime = function(transition) {
		var duration = parseFloat(transition.duration) * 1000 || 0;
		var delay = parseFloat(transition.delay) * 1000 || 0;
		return duration + delay;
	};

	var show = function(animator, transition) {
		//現在この関数が実行されていることの証明書;
		var processId = animator.processId = new Object();

		//すでに表示されているなら処理を終了;
		if(animator.isDisplay()) {
			return 0;
		}

		var style = animator.element.style;
		style.display = 'block';
		style.opacity = '0';
		style.transition = '';
		//display: blockと同時に実行するとtransitionが適用されないので非同期で;
		window.requestAnimationFrame(function() {
			setTimeout(function() {
				style.opacity = animator.originalCSS.opacity;
				style.transitionProperty = 'opacity';
				style.transitionDuration = transition.duration;
				style.transitionTimingFunction = transition.timingFunction;
				style.transitionDelay = transition.delay;
			}, 0);
		});

		var transitionTime = getTransitionTime(transition);
		setTimeout(function() {
			//割り込み処理が入ったなら何もせず終了;
			if(animator.processId !== processId) {
				return;
			}

			style.opacity = '';
			style.transition = '';
		}, transitionTime);

		return transitionTime;
	};

	var hide = function(animator, transition) {
		//現在この関数が実行されていることの証明書;
		var processId = animator.processId = new Object();

		//display: none なら処理を終了;
		if(! animator.isDisplay()) {
			return 0;
		}

		var style = animator.element.style;
		style.opacity = '0';
		style.transitionProperty = 'opacity';
		style.transitionDuration = transition.duration;
		style.transitionTimingFunction = transition.timingFunction;
		style.transitionDelay = transition.delay;

		var transitionTime = getTransitionTime(transition);
		setTimeout(function() {
			//割り込み処理が入ったなら何もせず終了;
			if(animator.processId !== processId) {
				return;
			}

			style.display = 'none';
			style.opacity = '';
			style.transition = '';
		}, transitionTime);

		return transitionTime;
	};

	Animator.prototype.show = function(transition, async) {
		if(typeof transition !== 'object' || transition === null) {
			transition = new Object();
		}
		transition.duration = transition.duration || this.defaultTransition.duration;
		transition.timingFunction = transition.timingFunction || this.defaultTransition.timingFunction;
		transition.delay = transition.delay || this.defaultTransition.delay;

		var self = this;
		if(async === true) {
			this.animationController.clear();
		}
		this.animationController.enqueue(function() {
			return show(self, transition);
		});
		return this;
	};

	Animator.prototype.hide = function(transition, async) {
		if(typeof transition !== 'object' || transition === null) {
			transition = new Object();
		}
		transition.duration = transition.duration || this.defaultTransition.duration;
		transition.timingFunction = transition.timingFunction || this.defaultTransition.timingFunction;
		transition.delay = transition.delay || this.defaultTransition.delay;

		var self = this;
		if(async === true) {
			this.animationController.clear();
		}
		this.animationController.enqueue(function() {
			return hide(self, transition);
		});
		return this;
	};

	Animator.prototype.wait = function(ms) {
		this.animationController.enqueue(function() {
			return Number(ms) || 0;
		});
		return this;
	};

	return Animator;

})();
