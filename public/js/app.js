function colorize(config, interval, callback) {
	var i = 0,
		j = 0,
		step = 0,
		c,
		color,
		colors = ['red', 'green', 'blue'],
		ret = {},
		color_conf = {},
		from = 0,
		to = 0,
		conf = {},
		config_length = config.length;

	return setInterval(function() {
		conf = config[i % config_length];
		step = conf.step;
		ret = {
			red: 0,
			green: 0,
			blue: 0
		};

		for (c in colors) {
			color = colors[c];
			color_conf = conf[color] || {};
			from = Math.abs(Number(color_conf.from) || 0) % 256;
			to = Math.abs(Number(color_conf.to) || 0) % 256;
			ret[color] = Math.floor(from + (to - from) / step * j);
		}

		j++;
		if (j >= step) {
			j = 0;
			i++;
		}

		callback(ret);
	}, interval);
}

$(document).ready(function() {

	// jquery validator kiegészítések
	jQuery.validator.addMethod('json', function(value, element, params) {
		try {
			JSON.parse(value);
		} catch (e) {
			return false;
		}
		return true;
	}, jQuery.validator.format('This field has to be JSON.'));
	// end jquery validator kiegészítések

	// jquery validator init
	$('form.validate').each(function() {
		var $this = $(this);
		$this.validate({
			validClass: '',
			errorElement: 'span',
			errorClass: 'validate-msg has-error'
		});
	});
	// end jquery validator init

	var $meta = $('meta[name="theme-color"]'),
		$body = $('body'),
		$config = $('#config'),
		config = $config.val(),
		tcolorize,
		interval = 40,
		color = 'rgb(0, 0, 0)',
		colorize_callback = function(rgb) {
			color = 'rgb(' + (rgb.red || 0) + ', ' + (rgb.green || 0) + ', ' + (rgb.blue || 0) + ')';
			$meta.attr('content', color);
			$body.css('background-color', color);
		},
		init_colorize = function(e) {
			try {
				if (e) {
					e.preventDefault();
				}
				config = JSON.parse($config.val());
				clearInterval(tcolorize);
				tcolorize = colorize(config, interval, colorize_callback);
				$('.play').hide();
				$('.pause').show();
			} catch (e) {}
		},
		play_pause = function(e) {
			if (e) {
				e.preventDefault();
			}
			if (tcolorize) {
				clearInterval(tcolorize);
				tcolorize = undefined;
				$('.play').show();
				$('.pause').hide();
			} else {
				tcolorize = colorize(config, interval, colorize_callback);
				$('.play').hide();
				$('.pause').show();
			}
		},
		save_config = function(e) {
			e.preventDefault();
			var $this = $(this);
			$.post($this.attr('href'), {
					config: JSON.stringify(config)
				})
				.done(function(resp) {
					if (window.history.replaceState) {
						window.history.replaceState(null, null, resp.hash);
					} else {
						document.location.replace(document.location.origin + '/'.resp.hash);
					}
					$this.find('.done').fadeIn('fast').delay(3000).fadeOut('fast');
				})
				.fail(function() {
					$this.find('.fail').fadeIn('fast').delay(3000).fadeOut('fast');
				});
		},
		txt_resize = function() {
			$config.outerHeight($config.height() - ($config.parents('form').outerHeight() - $(window).height()));
		};

	$('.save').on('click', save_config);

	$('.play,.pause').on('click', play_pause);

	$('form.colorize').on('submit', init_colorize);
	$('form.colorize').each(init_colorize);

	$(window).on('resize', txt_resize);
	$(window).each(txt_resize);
});