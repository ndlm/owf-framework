/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.data.WikipediaStore"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.WikipediaStore"] = true;
dojo.provide("dojox.data.WikipediaStore");

dojo.require("dojo.io.script");
dojo.require("dojox.rpc.Service");
dojo.require("dojox.data.ServiceStore");

dojo.experimental("dojox.data.WikipediaStore");

dojo.declare("dojox.data.WikipediaStore", dojox.data.ServiceStore,{
	//	summary:
	//		Initializer for the Wikipedia data store interface.
	//	description:
	//		The WikipediaStore is a data store interface to Wikipedia, using the
	//		Wikipedia SMD spec from dojox.rpc. It currently is useful only for
	//		finding articles that contain some particular text or grabbing single
	//		articles by full name; no wildcards or other filtering are supported.
	//	example:
	//		|	var store = new dojox.data.WikipediaStore();
	//		|	store.fetch({
	//		|		query: {title:"Dojo Toolkit"},
	//		|		onItem: function(item){
	//		|			dojo.byId("somediv").innerHTML = item.text["*"];
	//		|		}
	//		|	});
	constructor: function(options){
		if(options && options.service){
			this.service = options.service;
		}else{
			var svc = new dojox.rpc.Service(dojo.moduleUrl("dojox.rpc.SMDLibrary", "wikipedia.smd"));
			this.service = svc.query;
		}

		this.idAttribute = this.labelAttribute = "title";
	},

	fetch: function(/* object */ request){
		//	summary:
		//		Fetch a page or some partially-loaded search results from
		//		Wikipedia. Note that there isn't a way to sort data coming
		//		in from the API, so we just ignore the *sort* parameter.
		//	example:
		//		Loading a page:
		//		|	store.fetch({
		//		|		query: {title:"Dojo Toolkit"},
		//		|		// define your handlers here
		//		|	});
		//	example:
		//		Searching for pages containing "dojo":
		//		|	store.fetch({
		//		|		query: {
		//		|			action: "query",
		//		|			text: "dojo"
		//		|		},
		//		|		// define your handlers here
		//		|	});
		//	example:
		//		Searching for the next 50 pages containing "dojo":
		//		|	store.fetch({
		//		|		query: {
		//		|			action: "query",
		//		|			text: "dojo",
		//		|			start: 10,
		//		|			count: 50 // max 500; will be capped if necessary
		//		|		},
		//		|		// define your handlers here
		//		|	});
		var rq = dojo.mixin({}, request.query);
		if(rq && (!rq.action || rq.action === "parse")){
			// default to a single page fetch
			rq.action = "parse";
			rq.page = rq.title;
			delete rq.title;

		}else if(rq.action === "query"){
			// perform a full text search on page content
			rq.list = "search";
			rq.srwhat = "text";
			rq.srsearch = rq.text;
			if(request.start){
				rq.sroffset = request.start-1;
			}
			if(request.count){
				rq.srlimit = request.count >= 500 ? 500 : request.count;
			}
			delete rq.text;
		}
		request.query = rq;
		return this.inherited(arguments);
	},

	_processResults: function(results, def){
		if(results.parse){
			// loading a complete page
			results.parse.title = dojo.queryToObject(def.ioArgs.url.split("?")[1]).page;
			results = [results.parse];

		}else if(results.query && results.query.search){
			// loading some search results; all we have here is page titles,
			// so we mark our items as incomplete
			results = results.query.search;
			var _thisStore = this;
			for(var i in results){
				results[i]._loadObject = function(callback){
					_thisStore.fetch({
						query: { action:"parse", title:this.title },
						onItem: callback
					});
					delete this._loadObject;
				}
			}
		}
		return this.inherited(arguments);
	}
});


}
