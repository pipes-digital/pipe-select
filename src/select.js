const pipeSelect = {
	// Get an array of elements, return selector that covers all of them, but not the elements in blocked
	// This will not try to create unique selectors always, but generalize them when sound
	select: function(elements, blocked, options) {
		if (elements.length == 1) {
		    return this.getSingleSelector(elements[0], blocked, options);
		} else {
			return this.getMultiSelector(elements, blocked, options);
		}
	},
	// Get selector that uniquely queries element
	getSingleSelector: function(element, blocked, options) {
		console.log("single selector");
		var selectors = this.getAllSelectors(element, options);
		return selectors[0]; // TODO: What's the best selector to return here, to match only element?
		
	},
	// Get selector that queries elements, but maybe also some more, but never the blocked nodes
	getMultiSelector: function(elements, blocked, options) {
		console.log("multi selector");
		var selectors = [];
		for (var i=0;i<elements.length;i++) {
		    selectors.push(this.getAllSelectors(elements[i], options));
		}
		selectors = selectors.flat();
		var validSelectors = selectors.filter(sel => (! this.matches(sel, blocked)));
		var optimisticSelectors = validSelectors.filter(sel => this.matchesAll(sel, elements));
		if (optimisticSelectors.length > 0) {
			return optimisticSelectors[0]; // TODO: Which one is the best to return here?
		}
		// Since there is not one selector that selects all target elements we need to combine our available selectors
        // We just have to grab a combination of selectors that matches all elements
        // TODO: Make this faster, maybe by pruning unnecessary selectors?
        var selectorCombinations = this.getAllSubArrays(validSelectors);
        for (var i=0;i<selectorCombinations.length;i++) {
            var selectorCombination = selectorCombinations[i];
            // And now we see which elements that combination matches
            var matched = [];
            for (var j=0;j<selectorCombination.length;j++) {
                matched.push(Array.prototype.slice.call(document.querySelectorAll(selectorCombination[j])));
            }
            matched = matched.flat();
            // If the combined selector matches all of the target elements we have a working combination
            var selector = selectorCombination.join(',');
            if (this.matchesAll(selector, elements)) {
                return selector;
            }
        }
	},
    // The set of the sub arrays is the binary representation of the the nth value ranging from 0 to (2^n) - 1.
    // https://softwareengineering.stackexchange.com/a/256156/92420
    // TODO: Zeige Joss
    getAllSubArrays: function(elements) {
        subarrays = [];
        var n = elements.length;
        for (var i=1;i<(Math.pow(2, n) - 1);i++) {
            subarray = []
            var binary = i.toString(2);
            for (var j=0;j<binary.length;j++) {
                if (binary[j] === "1") {
                    subarray.push(elements[j]);
                }
            }
            subarrays.push(subarray);
        }
        return subarrays;
    },
	getAllSelectors: function(element, options) {
		var selectors = []
		if (element.id) {
		    selectors.push('#' + element.id);
			// TODO: Convert this selector if id is only a number
		}
		if (element.classList.length > 0) {
			classSelector = "";
			for (var i=0;i<element.classList.length;i++) {
				classSelector+="." + element.classList.item(i);
				selectors.push("." + element.classList.item(i));
			}
			selectors.push(classSelector);
			selectors.push(element.tagName + classSelector);
		}
		selectors.push(element.tagName);
		
		
		if (element.parentNode.id) {
			// TODO: Don't just use the id here, but a set of selectors that target the parent node. Maybe also the first parental node that has an id?
			var selectorsWithParent = []
			for (var i=0;i<selectors.length;i++) {
				selectorsWithParent.push("#" + element.parentNode.id + " " + selectors[i]);
			}
			selectors = selectors.concat(selectorsWithParent)
		}
		selectors.push(element.parentNode.tagName + " " + element.tagName);
		return selectors;
	},
	// return true if selector matches at least one of the element in elements
	matches: function(selector, elements) {
		var matched = document.querySelectorAll(selector);
		for (var i=0;i<matched.length;i++) {
			if (elements.includes(matched[i])) {
				return true;
			}
		}
		return false;
	},
	// return true if selector matches all of the element in elements
	matchesAll: function(selector, elements) {
		var matched = document.querySelectorAll(selector);
		matched = Array.prototype.slice.call(matched);
		for (var i=0;i<elements.length;i++) {
			if (! matched.includes(elements[i])) {
				return false;
			}
		}
		return true;
	}
};