/**
 * Created by inspur on 2016/12/31.
 */
;
(function() {
	'use strict';

	var $form_add_task = $('.add-task'),
		task_list = [],
		$task_list = $('.task-list'),
		$task_detail = $('.task-detail'),
		$task_detail_mask = $('.task-detail-mask'),
		$task_delete_trigger,
		$task_detail_trigger,
		$detail_form = $('.detail_form'),
		$detail_form_content,
		$detail_form_content_input,
		$task_check,
		$task_item,
		$msg_content = $('.msg-content'),
		$alerter = $('.alerter'),
		$msg = $('.msg'),
		$msg_confirm = $('.anchor.confirmed')
		;

	init();

	/**
	 * 初始化
	 */
	function init() {
		//注意写法，如果获取为undefine，赋值[]
		task_list = store.get('task_list') || [];
		render_task_list();
		task_remind_check();
		listen_msg_event();
		console.log(task_list);
	}

	function task_remind_check() {
		var current_timestamp;
		var itl = setInterval(function() {
			for(var i = 0; i < task_list.length; i++) {
				var item = task_list[i],
					task_timestamp;
				if(!item || !item.remind_date || item.informed)
					continue;

				current_timestamp = (new Date()).getTime();
				task_timestamp = (new Date(item.remind_date)).getTime();
				if(current_timestamp - task_timestamp >= 1) {
					show_msg(item.content);
					task_list[i].informed = true;
					store.set('task_list', task_list);
				}
			}
		}, 300);
	}

	function show_msg(msg) {
		if(!msg) return;
		$msg_content.html(msg);
		$alerter.get(0).play();
		$msg.show();
	}

	function hide_msg() {
		$msg.hide();
	}
	
	function listen_msg_event() {
    $msg_confirm.on('click', function () {
      hide_msg();
    })
  }

	/**
	 * 新任务提交
	 */
	$form_add_task.on('submit', function(e) {
		e.preventDefault();
		var new_task = {};
		new_task.content = $(this).find('input[name=content]').val();
		$(this).find('input[name=content]').val('');
		if(!new_task.content) return;
		task_list.push(new_task);
		store.set('task_list', task_list);
		render_task_list();
	});

	/**
	 * 渲染任务列表
	 */
	function render_task_list() {
		$task_list.html('');
		var task_item_normal = [];
		var task_item_complete = [];
		$.each(task_list, function(index, task) {
			if(task === undefined || task == null || task.content == null)
				return
			var list_task_tpl = '<div class="task-item" data-index="' + index + '">' +
				'<span><input type="checkbox" ' + (task.complete ? 'checked' : '') + ' /></span>' +
				'<span class="task-content">' + task.content + '</span>' +
				'<span class="float-right">' +
				'<span class="anchor delete"> 删除</span>' +
				'<span class="anchor detail"> 详细</span>' +
				'</span>' +
				'</div>';
			if(task.complete)
				task_item_complete.push($(list_task_tpl));
			else
				task_item_normal.push($(list_task_tpl));
		})
		$.each(task_item_complete, function(index, task_item) {
			$(task_item).addClass('completed');
			$task_list.prepend(task_item);
		});
		$.each(task_item_normal, function(index, task_item) {
			$task_list.prepend(task_item);
		});
		$task_item = $('.task-item');
		$task_delete_trigger = $('.anchor.delete');
		$task_detail_trigger = $('.anchor.detail');
		$task_check = $('.task-item').find('[type=checkbox]');
		task_item_listener();
		task_delete_trigger_listener();
		task_detail_trigger_listener();
		task_check_listener();
	}

	function task_item_listener() {
		$task_item.on('dblclick', function() {
			var index = $(this).data('index');
			if(index === undefined || !task_list[index]) return;
			task_detail_show(index);
		});
	}

	function task_delete_trigger_listener() {
		$task_delete_trigger.on('click', function() {
			var $item = $(this).parent().parent();
			var index = $item.data('index');
			if(index === undefined || !task_list[index]) return;
			if(confirm('确定删除？')) {
				task_list.splice(index, 1);
				store.set('task_list', task_list);
				render_task_list();
			}
		});
	}

	function task_detail_trigger_listener() {
		$task_detail_trigger.on('click', function() {
			var $item = $(this).parent().parent();
			var index = $item.data('index');
			if(index === undefined || !task_list[index]) return;
			task_detail_show(index);
		});
	}

	function task_check_listener() {
		$task_check.on('click', function() {
			var $item = $(this).parent().parent();
			var index = $item.data('index');
			if(index === undefined || !task_list[index]) return;
			task_list[index].complete = !task_list[index].complete;
			task_list[index].informed = task_list[index].complete;
			store.set('task_list', task_list);
			render_task_list();
		});
	}

	function task_detail_show(index) {
		var task = task_list[index];
		var task_detail_tpl =
			'<form class="detail_form">' +
			'<div class="content">' + task.content + '</div>' +
			'<div><input type="text" style="display:none;" name="content" value="' + task.content + '"/></div>' +
			'<div>' +
			'<div class="desc">' +
			'<textarea name="desc">' +
			(task.desc || '') +
			'</textarea>' +
			'</div>' +
			'</div>' +
			'<div class="remind">' +
			'<input type="text" name="remind_date" value="' + (task.remind_date || '') + '" />' +
			'</div>' +
			'<div class="detail_submit">' +
			'<button type="submit">提交</button>' +
			'</div>' +
			'</form>';
		$task_detail.html(task_detail_tpl);
		$('.remind').find('[name=remind_date]').datetimepicker();
		$detail_form = $task_detail.find('form');
		$detail_form_content = $detail_form.find('div[class=content]');
		$detail_form_content_input = $detail_form.find('[name=content]');
		$detail_form_content.on('dblclick', function() {
			$(this).hide();
			$detail_form_content_input.show();
		});

		$detail_form.on('submit', function(e) {
			e.preventDefault();
			var task = {};
			task.content = $(this).find('[name=content]').val();
			task.desc = $(this).find('[name=desc]').val();
			task.remind_date = $(this).find('[name=remind_date]').val();
			task.informed = false;
			task_list[index] = $.extend({}, task_list[index], task);
			store.set('task_list', task_list);
			render_task_list();
			task_detail_hide();
		});

		$task_detail.show();
		$task_detail_mask.show();
	}

	$task_detail_mask.on('click', task_detail_hide);

	function task_detail_hide() {
		$task_detail.hide();
		$task_detail_mask.hide();
	}

})();