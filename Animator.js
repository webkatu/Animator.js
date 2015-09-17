var Animator = (function() {
	var Animator = function(element) {
		//例外処理;
		if(arguments.length === 0) {
			throw (function() {
				var error = new TypeError();
				error.message = "Failed to construct 'Animation': 1 argument required, but only 0 present.";
				return error;
			})();
		}else if(!(element instanceof HTMLElement)) {
			throw (function() {
				var error = new TypeError();
				error.message = "Failed to construct 'Animation': Element must be provided.";
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
			promise: {
				value: Promise.resolve(),
				configurable: true,
				writable: true,
			},
			//現在実行されている関数を識別する証明書;
			processId: {
				value: null,
				configurable: true,
				writable: true,
			},
		});
	};

	//callbackでpromiseオブジェクトを返すとresolve時に次のタスクに行く;
	Animator.prototype.animate = function(callback, async) {
		if(async === true) {
			this.processId = new Object();
			this.promise = callback();
			if(! this.promise instanceof Promise) {
				this.promise = Promise.resolve();
			}
			return this;
		}

		this.promise = this.promise.then(function() {
			return callback();
		});
		return this;
	};

	Animator.prototype.isDisplay = function() {
		return this.css.display !== 'none';
	};

	var isSameOpacity = function(animator) {
		return animator.css.opacity === animator.originalCSS.opacity;
	};

	var getTransitionTime = function(transition) {
		var duration = parseFloat(transition.duration) * 1000 || 0;
		var delay = parseFloat(transition.delay) * 1000 || 0;
		return duration + delay;
	};

	var showPromise = function(animator, transition) {
		var resolve;
		var reject;
		var promise = new Promise(function(res, rej) {
			resolve = res;
			reject = rej;
		});

		//現在この関数が実行されていることの証明書;
		var processId = animator.processId;
		
		//すでに表示されているなら処理を終了;
		if(animator.isDisplay() && isSameOpacity(animator)) {
			resolve();
			return promise;
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
				reject();
				return;
			}

			style.opacity = '';
			style.transition = '';
			resolve();
		}, transitionTime);

		return promise;
	};

	var hidePromise = function(animator, transition) {
		var resolve;
		var reject;
		var promise = new Promise(function(res, rej) {
			resolve = res;
			reject = rej;
		});

		//現在この関数が実行されていることの証明書;
		var processId = animator.processId;

		//display: none なら処理を終了;
		if(! animator.isDisplay()) {
			resolve();
			return promise;
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
				reject();
				return;
			}

			style.display = 'none';
			style.opacity = '';
			style.transition = '';
			resolve();
		}, transitionTime);

		return promise;
	};

	Animator.prototype.show = function(transition, async) {
		//引数チェック;
		if(typeof transition !== 'object' || transition === null) {
			transition = new Object();
		}
		transition.duration = transition.duration || this.defaultTransition.duration;
		transition.timingFunction = transition.timingFunction || this.defaultTransition.timingFunction;
		transition.delay = transition.delay || this.defaultTransition.delay;

		var self = this;
		return this.animate(function() {
			return showPromise(self, transition);
		}, async);
	};

	Animator.prototype.hide = function(transition, async) {
		//引数チェック;
		if(typeof transition !== 'object' || transition === null) {
			transition = new Object();
		}
		transition.duration = transition.duration || this.defaultTransition.duration;
		transition.timingFunction = transition.timingFunction || this.defaultTransition.timingFunction;
		transition.delay = transition.delay || this.defaultTransition.delay;

		var self = this;
		return this.animate(function() {
			return hidePromise(self, transition);
		}, async);
	};

	Animator.prototype.wait = function(ms) {
		return this.animate(function() {
			return new Promise(function(resolve, reject) {
				setTimeout(resolve, Number(ms) || 0);
			});
		}, false);
	};

	return Animator;

})();