function FlipSet($wrapper, height, nodes, isMobile) {
	this.flips_ = [];
	this.currentIndex_ = 0;
	this.height = height;
	this.isMobile = isMobile;

	for(var i = 0, node; node = nodes[i]; i++) {
		this.flips_.push(new Flip(node, height, this));
	}

	this.containerNode_ = $wrapper;
	this.containerNode_.addClass("flip-set");
	this.containerNode_.css("height", height + 'px');

	this.displayCurrentFlip_();
}

FlipSet.prototype.displayCurrentFlip_ = function() {
	this.containerNode_.empty();
	this.containerNode_.append(this.flips_[this.currentIndex_].originalNode_);
}

FlipSet.prototype.getCurrentIndex = function(node) {
	return this.currentIndex_;
}

FlipSet.prototype.push = function(node) {
	this.flips_.push(new Flip(node, this.height, this));
}

FlipSet.prototype.unshift = function(node) {
	this.flips_.unshift(new Flip(node, this.height, this));
	this.currentIndex_++;
}

FlipSet.prototype.getLength = function() {
	return this.flips_.length;
}

FlipSet.prototype.next = function(callback) {
	if(this.isTransitioning_)
		return;

	this.isTransitioning_ = true;
	var currentFlip = this.flips_[this.currentIndex_]
	var nextFlip = this.flips_[this.currentIndex_ + 1];

	currentFlip.beginFlipFrom();
	nextFlip.beginFlipTo();
	var self = this;
	nextFlip.immediate(nextFlip.foldBottom, function() {
		currentFlip.foldTop();
		
		// Fix for iPod
		// Breaks on firefox
		if (self.isMobile) {
			currentFlip.moveToBack();
			nextFlip.moveToFront();
		} 

		// End of fix for iPod

		currentFlip.onTransitionEnd(function() {
			nextFlip.unfold();
			currentFlip.moveToBack();
			nextFlip.onTransitionEnd(function() {

				nextFlip.endFlipTo();
				currentFlip.endFlipFrom();
				self.isTransitioning_ = false;

				callback();console.log("done");
			});
		});
	});

	this.currentIndex_++;
};

FlipSet.prototype.previous = function(callback) {
	if(this.isTransitioning_)
		return;

	this.isTransitioning_ = true;
	var currentFlip = this.flips_[this.currentIndex_]
	var previousFlip = this.flips_[this.currentIndex_ - 1];

	previousFlip.beginFlipTo();
	currentFlip.beginFlipFrom();

	var self = this;
	previousFlip.immediate(previousFlip.foldTop, function() {
		currentFlip.foldBottom();
		currentFlip.onTransitionEnd(function() {
			previousFlip.unfold();
			if (!self.isMobile) {
				previousFlip.moveToFront(); // Chrome OK
				currentFlip.moveToBack();
			}
			previousFlip.onTransitionEnd(function() {
				previousFlip.endFlipTo();
				currentFlip.endFlipFrom();
				self.isTransitioning_ = false;
				callback();

			});
		});
	});

	this.currentIndex_--;
};

FlipSet.prototype.hasNext = function() {
	return this.currentIndex_ < this.flips_.length - 1;
};

FlipSet.prototype.hasPrevious = function() {
	return this.currentIndex_ > 0;
};
function Flip(node, height, parentSet) {
	this.originalNode_ = node;
	this.parentSet_ = parentSet;
	this.init_(height);
}

Flip.prototype.init_ = function(height) {
	this.originalNode_.css("height", height + "px");
	var node = this.originalNode_;

	var containerNode = $("<div class='flip-container'/>");
	containerNode.css("height", height + 'px');

	var topContainerNode = $("<div class='flip-top-container flip-transitionable'/>");
	topContainerNode.append(node.clone());
	topContainerNode.css("height", Math.floor(height / 2) + 'px');
	//topContainerNode.find(".footer").css("bottom", -Math.floor(height/2) + 'px');

	var bottomContainerNode = $("<div class='flip-bottom-container flip-transitionable'/>");
	var bottomInnerContainerNode = $("<div class='flip-bottom-inner-container'/>");

	bottomInnerContainerNode.append(node.clone());
	bottomInnerContainerNode.css("height", height + 'px');

	bottomContainerNode.append(bottomInnerContainerNode);
	bottomContainerNode.css("height", Math.ceil(height / 2) + 'px');

	bottomInnerContainerNode.css("top", -Math.floor(height / 2) + 'px');

	containerNode.append(topContainerNode);
	containerNode.append(bottomContainerNode);

	this.containerNode_ = containerNode;
	this.topContainerNode_ = topContainerNode;
	this.bottomContainerNode_ = bottomContainerNode;
	this.bottomInnerContainerNode_ = bottomInnerContainerNode;

	var self = this;
	var onTransitionEnd = function() {
		if(self.onTransitionEnd_) {
			self.onTransitionEnd_();
			self.onTransitionEnd_ = null;
		}
	};
	try {
		this.containerNode_.bind("webkitTransitionEnd", onTransitionEnd);
	} catch (err) {
	}

	try {
		// Should be mozTransitionEnd, but is transition end per
		// https://developer.mozilla.org/en/CSS/CSS_transitions#Detecting_the_completion_of_a_transition
		this.containerNode_.bind("transitionend", onTransitionEnd);
	} catch (err) {
	}
};

Flip.prototype.moveToFront = function() {
	this.containerNode_.css("z-index", 1);
};

Flip.prototype.moveToBack = function() {
	this.containerNode_.css("z-index", -1);
};

Flip.prototype.beginFlipFrom = function() {
	this.moveToFront();
	this.originalNode_.replaceWith(this.containerNode_);
};

Flip.prototype.beginFlipTo = function() {
	this.parentSet_.containerNode_.append(this.containerNode_);
	this.moveToBack();
};

Flip.prototype.endFlipFrom = function() {
	this.containerNode_.detach();
	this.containerNode_.css("z-index", 'auto');
};

Flip.prototype.endFlipTo = function() {
	this.containerNode_.parent().append(this.originalNode_);
	this.containerNode_.detach();
	this.containerNode_.css("z-index", 'auto');
};

Flip.prototype.immediate = function(method, callback) {
	this.topContainerNode_.removeClass('flip-transitionable');
	this.bottomContainerNode_.removeClass('flip-transitionable');

	method.call(this);

	var self = this;
	window.setTimeout(function() {
		self.topContainerNode_.addClass('flip-transitionable');
		self.bottomContainerNode_.addClass('flip-transitionable');

		callback();
	});
};

Flip.prototype.foldTop = function() {
	this.containerNode_.addClass('folded-top');
};

Flip.prototype.foldBottom = function(opt_immediate) {
	this.containerNode_.addClass('folded-bottom');
}

Flip.prototype.unfold = function(opt_immediate) {
	this.containerNode_.removeClass('folded-top');
	this.containerNode_.removeClass('folded-bottom');
}

Flip.prototype.onTransitionEnd = function(callback) {
	this.onTransitionEnd_ = callback;
};
