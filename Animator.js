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
			element: {
				value: element,
				enumerable: true,
			},
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
			displayingMode: {
				value: 'display',
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

	Animator.prototype.init = function() {
		this.promise = Promise.resolve();
		return this;
	};

	Animator.prototype.animate = function(callback, async) {
		if(typeof callback !== 'function') {
			return this;
		}

		var self = this;
		if(async === true) {
			this.init();
		}

		this.promise = this.promise.then(function() {
			self.processId = new Object();
			return new Promise(function(resolve) {
				callback(self, self.processId, resolve);
			});
		});
		return this;
	};

	Animator.prototype.isDisplay = function() {
		if(this.displayingMode === 'visibility') {
			return this.css.visibility !== 'hidden';
		}else {
			return this.css.display !== 'none';
		}
	};

	var isSameOpacity = function(animator) {
		return animator.css.opacity === animator.originalCSS.opacity;
	};

	var getTransitionTime = function(transition) {
		var duration = parseFloat(transition.duration) * 1000 || 0;
		var delay = parseFloat(transition.delay) * 1000 || 0;
		return duration + delay;
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
		return this.animate(function(animator, processId, next) {
			var property;
			var value;
			if(self.displayingMode === 'visibility') {
				property = 'visibility';
				value = 'visible';
			}else {
				property = 'display';
				value = 'block';
			}

			//すでに表示されているなら処理を終了;
			if(animator.isDisplay() && isSameOpacity(animator)) {
				next();
				return;
			}

			var style = animator.element.style;
			style[property] = value;
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
				next();
			}, transitionTime);
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
		return this.animate(function(animator, processId, next) {
			var property;
			var value;
			if(self.displayingMode === 'visibility') {
				property = 'visibility';
				value = 'hidden';
			}else {
				property = 'display';
				value = 'none';
			}
			//表示されていないなら処理を終了;
			if(! animator.isDisplay()) {
				next();
				return;
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

				style[property] = value;
				style.opacity = '';
				style.transition = '';
				next();
			}, transitionTime);
		
		}, async);
	};

	Animator.prototype.wait = function(ms) {
		return this.animate(function(animator, processId, next) {
			setTimeout(next, Number(ms) || 0);
		}, false);
	};

	return Animator;

})();