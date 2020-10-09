// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.htmlCODE = function(runtime)
{
	this.runtime = runtime;
};

var onreturn = false;
var jsreturn = "";

function JSreturn(text)
{
	onreturn = true;
	jsreturn = text;
};

/////////////////////////////////////
// Plugin
(function ()
{
	/////////////////////////////////////
	var pluginProto = cr.plugins_.htmlCODE.prototype;

	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};

	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created
	instanceProto.onCreate = function()
	{
		if (this.properties[6]) {
			this.elem = document.createElement("div");
			this.elem.innerHTML = this.properties[8];
		} else {
			this.elem = document.createElement("iframe");
			if (this.properties[7])
				GoToURL(this, this.properties[7]);
		}

		/////////////////////////////////////
		// Attribute
		this.elem.id = this.properties[0] ? this.properties[0] : makeID();
		this.elem.setAttribute("id", this.elem.id);

		if (this.properties[2])
			this.elem.setAttribute("title", this.properties[2]);

		// allow fullscreen
		this.elem.setAttribute("frameborder", 0);
		this.elem.setAttribute("allowFullScreen", "");
		// --- attribute end

		/////////////////////////////////////
		// Style
		var widthfactor = this.width > 0 ? 1 : -1;
		var heightfactor = this.height > 0 ? 1 : -1;
		this.elem.style.cssText = "-webkit-transform:rotate("+ this.angle * widthfactor * heightfactor*180/3.1416 + "deg);" +
						 		"-moz-transform:rotate("+ this.angle * widthfactor * heightfactor*180/3.1416 + "deg);" +
								"-o-transform:rotate("+ this.angle * widthfactor * heightfactor*180/3.1416 + "deg);" +
								"-ms-transform:rotate("+ this.angle * widthfactor * heightfactor*180/3.1416 + "deg);";

		this.elem.style.background = (this.properties[3]);
		this.elem.style.border = this.properties[4] ? this.properties[4] : "none";
		this.elem.style.color = (this.properties[9]);

		switch (this.properties[5]) {
			case 0:
				this.elem.setAttribute("scrolling", "no");
				this.elem.style.overflow = "hidden";
				break;
			case 1:
				this.elem.style.overflow = "auto";
				break;
			case 2:
				this.elem.style.overflowX = "auto";
				this.elem.style.overflowY = "hidden";
				break;
			case 3:
				this.elem.style.overflowX = "hidden";
				this.elem.style.overflowY = "auto";
				break;
		};

		if (this.properties[11])
			ImpCSS(this, this.properties[11]);
		// --- style end

		/////////////////////////////////////
		// Script
		if (this.properties[12]) {
			this.JSref = document.createElement('script');
			this.JSref.setAttribute("type", "text/javascript");
			this.JSref.setAttribute("async", "async");
			this.JSref.setAttribute("src", this.properties[12]);

			if (typeof this.JSref != "undefined")
				document.getElementsByTagName("head")[0].appendChild(this.JSref);
		}
		// --- script end

		/////////////////////////////////////
		// Change "body" to "c2canvasdiv" *(to work with request full screen in browser plugin)
		// jQuery(this.elem).appendTo("body");
		jQuery(this.elem).appendTo("#c2canvasdiv");

		if (!this.properties[1]) {
			jQuery(this.elem).hide();
			this.visible = false;
		}

		this.scale = 1.0;
		this.updatePosition();
		this.runtime.tickMe(this);
	};

	instanceProto.onDestroy = function ()
	{
		jQuery(this.elem).remove();
		this.elem = null;
	};

	instanceProto.tick = function ()
	{
		this.updatePosition();
	};

	instanceProto.updatePosition = function (first)
	{
		if (this.runtime.isDomFree)
			return;

		if (onreturn)
		{
			this.runtime.trigger(Cnds.prototype.OnReturn, this);
			this.runtime.trigger(Cnds.prototype.JSreturn, this);
		}

		var left = this.layer.layerToCanvas(this.x, this.y, true);
		var top = this.layer.layerToCanvas(this.x, this.y, false);
		var right = this.layer.layerToCanvas(this.x + this.width, this.y + this.height, true);
		var bottom = this.layer.layerToCanvas(this.x + this.width, this.y + this.height, false);

		// Is entirely offscreen or invisible: hide
		if (!this.visible || !this.layer.visible || right <= 0 || bottom <= 0 || left >= this.runtime.width || top >= this.runtime.height) {
			jQuery(this.elem).hide();
			return;
		}

		// Truncate to canvas size
		left = left < 1 ? 1 : left;
		top = top < 1 ? 1 : top;
		right = right >= this.runtime.width ? this.runtime.width - 1 : right;
		bottom = bottom >= this.runtime.height ? this.runtime.height - 1 : bottom;

		jQuery(this.elem).show();
		
		var offx = left + jQuery(this.runtime.canvas).offset().left;
		var offy = top + jQuery(this.runtime.canvas).offset().top;
		jQuery(this.elem).offset({left: offx, top: offy});
		jQuery(this.elem).width(right - left);
		jQuery(this.elem).height(bottom - top);

		//rounding position & width to avoid jitter
		this.elem.width = Math.round(this.elem.width);
		this.elem.height = Math.round(this.elem.height);
		this.elem.x = Math.round(this.elem.x);
		this.elem.y = Math.round(this.elem.y);

		if (this.properties[10] == 1)
			jQuery(this.elem).css("font-size", ((this.layer.getScale(true) / this.runtime.devicePixelRatio) - 0.2) + "em");
		if (this.properties[10] == 2)
			jQuery(this.elem).css("font-size", ((this.layer.getScale(true) / this.runtime.devicePixelRatio) - 0.3) + "em");
		if (this.properties[10] == 3)
			jQuery(this.elem).css("font-size", ((this.layer.getScale(true) / this.runtime.devicePixelRatio) - 0.1) + "em");
		if (this.properties[10] == 4)
			jQuery(this.elem).css("font-size", ((this.layer.getScale(true) / this.runtime.devicePixelRatio) - 0.05) + "em");
	};

	// only called if a layout object
	instanceProto.draw = function(ctx)
	{
	};

	instanceProto.drawGL = function(glw)
	{
	};

	//////////////////////////////////////
	// Functions
	function makeID() {
	    var text = "";
	    var possible = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		
	    for (var i = 0; i < 10; i++)
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    return text;
	};

	function ImpCSS(self, filename) {
		self.CSSref = document.createElement("link");
		self.CSSref.setAttribute("name", filename);
		self.CSSref.setAttribute("rel", "stylesheet");
		self.CSSref.setAttribute("type", "text/css");
		self.CSSref.setAttribute("href", filename);

		if (typeof self.CSSref != "undefined")
			document.getElementsByTagName("head")[0].appendChild(self.CSSref);

		self.cssFile = filename;
	};

	function GoToURL(this_, url_) {
		this_.load = 1;
		this_.elem.src = url_;

		jQuery.ajax({
			context: this_,
			dataType: "text",
			type: "GET",
			url: url_,
			success: function() {
				this_.elem.onload = (function (self) {
					return function() {
						self.runtime.trigger(Cnds.prototype.OnLoad, self);
					};
				})(this_);
				this_.load = 0;
			},
			error: function() {
				this_.elem.onload = (function (self) {
					return function() {
						self.runtime.trigger(Cnds.prototype.OnError, self);
					};
				})(this_);
				this_.load = 0;
			}
		});
	};

	//////////////////////////////////////
	// Conditions
	function Cnds() {};

	Cnds.prototype.CompareCSSFilename = function (text)
	{
		if (this.runtime.isDomFree)
			return false;

		return cr.equals_nocase(this.cssFile, text);
	};

	Cnds.prototype.CompareCSSStyle = function (text)
	{
		if (this.runtime.isDomFree)
			return false;

		return this.elem.style.cssText === text;
	};

	Cnds.prototype.CompareHTML = function (text, case_)
	{
		if (this.runtime.isDomFree)
			return false;

		if (case_ === 0)	// insensitive
			return cr.equals_nocase(this.elem.innerHTML, text);
		else				// sensitive
			return this.elem.innerHTML === text;
	};

	Cnds.prototype.OnError = function ()
	{
		return true;
	};

	Cnds.prototype.OnLoad = function ()
	{
		return true;
	};

	Cnds.prototype.OnReturn = function (text)
	{
		onreturn = false;
		return true;
	};

	Cnds.prototype.JSreturn = function (text, case_)
	{
		if (this.runtime.isDomFree)
			return false;

		if (case_ === 0)	// insensitive
			return cr.equals_nocase(jsreturn, text);
		else				// sensitive
			return jsreturn === text;
	};

	//--- iFrame
	Cnds.prototype.IsFocused = function ()
	{
		return this.elem === document.activeElement;
	};

	Cnds.prototype.IsLoading = function ()
	{
		return this.load;
	};

	Cnds.prototype.URL = function (text)
	{
		return (this.properties[6] ? 0 : (text == this.elem.contentWindow.location.href));
	};

	pluginProto.cnds = new Cnds();

	//////////////////////////////////////
	// Actions
	function Acts() {};

	Acts.prototype.SetVisible = function (vis)
	{
		if (this.runtime.isDomFree)
			return;
		
		this.visible = (vis !== 0);
	};

	Acts.prototype.SetTooltip = function (text)
	{
		if (this.runtime.isDomFree)
			return;
		
		this.elem.title = text;
	};

	Acts.prototype.ImpCSSFile = function (filename)
	{
		if (this.runtime.isDomFree)
			return;

		ImpCSS(this, filename);
	};

	Acts.prototype.RemCSSFile = function ()
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.remove = document.getElementsByTagName("link");

		for (var i = 0; i < this.elem.remove.length; i++) {
			if (this.elem.remove[i] && this.elem.remove[i].getAttribute("name") === this.cssFile) {
				this.elem.remove[i].parentNode.removeChild(this.elem.remove[i]);
				this.cssFile = "";
				return;
			}
		};
	};

	Acts.prototype.SetCSS = function (p, v)
	{
		if (this.runtime.isDomFree)
			return;

		jQuery(this.elem).css(p, v);
	};

	Acts.prototype.SetScale = function (scale, r)
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.style.transform = "scale(" + scale + ")";
		
		if (r) {
			this.width = (this.width * this.scale) / scale;
			this.height = (this.height * this.scale) / scale;
			this.scale = scale;
		}
	};
	
	//--- insertHTML
	Acts.prototype.SetHTML = function (text)
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.innerHTML = text;
	};

	Acts.prototype.AppendHTML = function(param)
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.innerHTML += (param);
	};

	Acts.prototype.LoadHTML = function (url_, postdata_)
	{
		if (this.runtime.isDomFree)
			return;

		this.load = 1;

		if(postdata_.length) {
			jQuery.ajax({
				context: this,
				dataType: "text",
				type: "POST",
				url: url_,
				data: postdata_,
				success: function(data) {
					this.load = 0;
					this.elem.innerHTML = data;
					this.runtime.trigger(Cnds.prototype.OnLoad, this);
				},
				error: function(err) {
					this.load = 0;
					this.elem.innerHTML = err;
					this.runtime.trigger(Cnds.prototype.OnError, this);
				}
			});
		} else {
			jQuery.ajax({
				context: this,
				dataType: "text",
				type: "GET",
				url: url_,
				success: function(data) {
					this.load = 0;
					this.elem.innerHTML = data;
					this.runtime.trigger(Cnds.prototype.OnLoad, this);
				},
				error: function() {
					this.load = 0;
					this.elem.innerHTML = err;
					this.runtime.trigger(Cnds.prototype.OnError, this);
				}
			});
		};
	};

	Acts.prototype.ScrollTop = function ()
	{
		if (this.runtime.isDomFree)
			return;

        this.elem.scrollTop = 0;
	};

	Acts.prototype.ScrollBottom = function ()
	{
		if (this.runtime.isDomFree)
			return;
		
		this.elem.scrollTop = this.elem.scrollHeight;
	};

	Acts.prototype.ScrollTo = function (to_)
	{
		if (this.runtime.isDomFree)
			return;
		
		to_ /= 100;
		this.elem.scrollTop = this.elem.scrollHeight;
		this.elem.scrollTop *= to_;
	};

	//--- iFrame
	Acts.prototype.Blur = function ()
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.blur();
	};

	Acts.prototype.Focus = function ()
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.focus();
	};

	Acts.prototype.SetURL = function (url_)
	{
		if (this.runtime.isDomFree)
			return;

		GoToURL(this, url_);
	};

	Acts.prototype.Backward = function ()
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.src = this.elem.contentWindow.history.back();
	};

	Acts.prototype.Forward = function ()
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.src = this.elem.contentWindow.history.forward();
	};

	Acts.prototype.Reload = function ()
	{
		if (this.runtime.isDomFree)
			return;

		this.elem.contentWindow.location.reload();
	};

	pluginProto.acts = new Acts();

	//////////////////////////////////////
	// Expressions
	function Exps() {};

	Exps.prototype.CSSFilename = function (ret)
	{
		ret.set_string(this.cssFile);
	};

	Exps.prototype.CSS = function (ret)
	{
		ret.set_string(this.elem.style.cssText);
	};

	//--- HTML
	Exps.prototype.ID = function (ret)
	{
		ret.set_string(this.elem.id);
	};

	Exps.prototype.HTML = function (ret)
	{
		ret.set_string(this.properties[6] ? this.elem.innerHTML : "<html>" + jQuery(this.elem).contents().find("*").html() + "</html>");
	};

	Exps.prototype.JSreturn = function (ret)
	{
		ret.set_string(jsreturn);
	};

	//--- iFrame
	Exps.prototype.URL = function (ret)
	{
		ret.set_string(this.properties[6] ? "" : this.elem.contentWindow.location.href);
	};

	pluginProto.exps = new Exps();

}());