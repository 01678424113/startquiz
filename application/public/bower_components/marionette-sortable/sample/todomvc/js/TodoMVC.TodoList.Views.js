/*global TodoMVC */
'use strict';

TodoMVC.module('TodoList.Views', function (Views, App, Backbone, Marionette, $) {
	// Todo List Item View
	// -------------------
	//
	// Display an individual todo item, and respond to changes
	// that are made to the item, including marking completed.
	Views.ItemView = Marionette.ItemView.extend({
		tagName: 'li',
		template: '#template-todoItemView',

		ui: {
			edit: '.edit'
		},

		events: {
			'click .destroy': 'deleteModel',
			'dblclick label': 'onEditClick',
			'keydown .edit': 'onEditKeypress',
			'focusout .edit': 'onEditFocusout',
			'click .toggle': 'toggle'
		},

		modelEvents: {
			'change': 'render'
		},

		onRender: function () {
			this.$el.removeClass('active completed');

			if (this.model.get('completed')) {
				this.$el.addClass('completed');
			} else {
				this.$el.addClass('active');
			}
		},

		deleteModel: function () {
			this.model.destroy();
		},

		toggle: function () {
			this.model.toggle().save();
		},

		onEditClick: function () {
			this.$el.addClass('editing');
			this.ui.edit.focus();
			this.ui.edit.val(this.ui.edit.val());
		},

		onEditFocusout: function () {
			var todoText = this.ui.edit.val().trim();
			if (todoText) {
				this.model.set('title', todoText).save();
				this.$el.removeClass('editing');
			} else {
				this.destroy();
			}
		},

		onEditKeypress: function (e) {
			var ENTER_KEY = 13, ESC_KEY = 27;

			if (e.which === ENTER_KEY) {
				this.onEditFocusout();
				return;
			}

			if (e.which === ESC_KEY) {
				this.ui.edit.val(this.model.get('title'));
				this.$el.removeClass('editing');
			}
		}
	});

	// Item List View
	// --------------
	//
	// Controls the rendering of the list of items, including the
	// filtering of activs vs completed items for display.
	Views.ListView = Backbone.Marionette.CompositeView.extend({
		template: '#template-todoListCompositeView',
		childView: Views.ItemView,
		childViewContainer: '#todo-list',

		ui: {
			toggle: '#toggle-all'
		},

		events: {
			'click #toggle-all': 'onToggleAllClick'
		},

		collectionEvents: {
			'all': 'update'
		},

		behaviors: {
			Sortable: {
				behaviorClass: Backbone.Marionette.SortableBehavior
			}
		},

		initialize: function () {
			this.listenTo(App.request('filterState'), 'change:filter', this.render, this);
			this.listenTo(App.request('filterState'), 'change:filter', this.switchSortable, this);
		},

		switchSortable: function() {
			// Sort is allowed only in "All" view
			if (App.request('filterState').get('filter') == 'all') {
				$(this.getChildViewContainer(this)).sortable('enable');
			} else {
				$(this.getChildViewContainer(this)).sortable('disable');
			}
		},

		addChild: function (child) {
			var filteredOn = App.request('filterState').get('filter');

			if (child.matchesFilter(filteredOn)) {
				Backbone.Marionette.CompositeView.prototype.addChild.apply(this, arguments);
			}
		},

		onRender: function () {
			this.update();
		},

		update: function () {
			if (App.request('filterState').get('filter') == 'all') {
				// Persist the order of items
				this.collection.each(function(item, i) {
					if (item.get('order') !== i) {
						item.set('order', i);
						item.save();
					}
				});
			}

			function reduceCompleted(left, right) {
				return left && right.get('completed');
			}

			var allCompleted = this.collection.reduce(reduceCompleted, true);

			this.ui.toggle.prop('checked', allCompleted);
			this.$el.parent().toggle(!!this.collection.length);
		},

		onToggleAllClick: function (e) {
			var isChecked = e.currentTarget.checked;

			this.collection.each(function (todo) {
				todo.save({ 'completed': isChecked });
			});
		}
	});
});
