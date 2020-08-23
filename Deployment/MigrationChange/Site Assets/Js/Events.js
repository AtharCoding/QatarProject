"use strict";
var _siteUrl = "";
var _allTypeFilterValue=isArabic?"الكل":"All";
var _eventStatusValues = {
	AllEvents: "All Events",
	Current: "Current",
	Upcoming: "Upcoming",
	Completed: "Completed"
};
var _eventStatusValuesAr = {
	AllEvents: "كل الأحداث",
	Current: "تيار",
	Upcoming: "القادمة",
	Completed: "منجز"
};

var ctx;
var eventList;
var eventCamlQuery;
var listItems;
var eventTypeListItems;
var itemLimit=2;
var eventCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};
var isRefreshData=false;

$(document).ready(function () {
	document.title = "Events";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', eventStart);
});

function eventStart() {
	getListDetails(_listTitleEvents);
	bindEventData("");
	bindLoadMoreEvent();
	setDefaultFilterValues();
	fillEventsFilterValues();
	setupLanguage();

	//For sharing site
	let metaTitle="Events";
	let metaDesc="Motife Events";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function bindEventData(whereQuery){
	if(isRefreshData)
		$("#eventContent").html("");

	eventCollections.RetrieveResultsets=[];
	eventCollections.MainResultSet=[];
	eventCollections.NextResultPosition="";
	eventCollections.StartIndex=0;
	eventCollections.EndIndex=0;

	ctx = SP.ClientContext.get_current();
	eventList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleEvents);

	eventCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	if(whereQuery)
		query += whereQuery;
	query += "</Query><RowLimit>"+itemLimit+"</RowLimit></View>";
	eventCamlQuery.set_viewXml(query);
	listItems = eventList.getItems(eventCamlQuery);

	let eventTypeList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleEventTypes);
	eventTypeListItems=eventTypeList.getItems(SP.CamlQuery.createAllItemsQuery());

	ctx.load(listItems);
	ctx.load(eventTypeListItems);
	ctx.executeQueryAsync(function(){
		eventCollections.StartIndex=0;
		eventCollections.EndIndex=listItems.get_count();
		eventCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
		loadMoreHideShow();
		fillEventItems();
	},failure);
}

function fillEventItems(){
	let eventTypes = [];
    for (let i = 0; i < eventTypeListItems.get_count(); i++) {
        let eachItem = eventTypeListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
        temp.EventTypeArabic = eachItem.get_item('EventTypeArabic');
        eventTypes.push(temp);
	}
	for(let i=0;i<listItems.get_count();i++){
		let tempObj={};
		tempObj.totalItemsCount=listItems.get_count();
		let eachEvent = listItems.getItemAtIndex(i);

			tempObj.Index=i;
			tempObj.ID=eachEvent.get_item('ID');
			tempObj.Title=isArabic?eachEvent.get_item("EventArabicTitle"):eachEvent.get_item('Title');

			let EventStartDateStr=eachEvent.get_item('EventStartDate');
			if(EventStartDateStr)
				tempObj.EventStartDate=getFormattedDate(EventStartDateStr);
			
			let EventEndDateStr=eachEvent.get_item('EventEndDate');
			if(EventEndDateStr)
				tempObj.EventEndDate=getFormattedDate(EventEndDateStr);

			let eventDetails=isArabic?eachEvent.get_item("EventArabicDesc"):eachEvent.get_item("EventDesc");
			if(eventDetails)
				tempObj.EventDesc=$("<div></div>").append(eventDetails).text();


			let eventType = eachEvent.get_item("EventTypeLookup");
			if (eventType){
				let eventTypeID=eventType.get_lookupId();
				let itemEventTypes=eventTypes.find(x=>x.ID==eventTypeID);
				if(itemEventTypes)
					tempObj.EventTypeIDs ={Title:isArabic?itemEventTypes.EventTypeArabic:itemEventTypes.Title};
			}
			
			let imgStr=eachEvent.get_fieldValues()['ImageUrl'];
			if(imgStr)
				tempObj.ImageUrl=getImageSrcValue(imgStr);
			
				eventCollections.RetrieveResultsets.push(tempObj);
				
	}
		eventCollections.RetrieveResultsets.sort(function(a,b) {return a.Index - b.Index;});
		let mainLength=eventCollections.MainResultSet.length;
		if(mainLength>0){
			$.each(eventCollections.RetrieveResultsets, function() {
				this.Index = mainLength+this.Index;
			});
		}
		eventCollections.MainResultSet=eventCollections.MainResultSet.concat(eventCollections.RetrieveResultsets);
		eventCollections.RetrieveResultsets=[];
		fillEventHtml(eventCollections.MainResultSet,eventCollections.StartIndex,eventCollections.EndIndex);
		loadMoreHideShow();	
}

function fillEventHtml(resultSet,startIndex,endIndex){
	for (let i = startIndex; i < endIndex; i++) {
		let eachEvent = resultSet[i];
		let htmlDesign=htmlDesignResult(eachEvent);
		$("#eventContent").append(htmlDesign.FutureEvent);
	}
}

function bindLoadMoreEvent(){
	$("#eventLoadMore").on("click",function(){
		isRefreshData=false;
		if (eventCollections.NextResultPosition != null) {
			eventCamlQuery.set_listItemCollectionPosition(eventCollections.NextResultPosition);
			listItems = eventList.getItems(eventCamlQuery);
			ctx.load(listItems);
			//Call the same function recursively until all the items in the current criteria are fetched.
			ctx.executeQueryAsync(function(){
				eventCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
				eventCollections.StartIndex=eventCollections.EndIndex;
				eventCollections.EndIndex=eventCollections.StartIndex+listItems.get_count();
				fillEventItems();
			}, failure);
		}
	});
}
function loadMoreHideShow(){
	if(eventCollections.NextResultPosition==null || eventCollections.MainResultSet.length==0)
		$("#eventLoadMore").hide();
	else
		$("#eventLoadMore").show();
}

function setDefaultFilterValues(){
	$("#filterStatusContent").selectpicker("destroy");
	$("#filterStatusContent option,#eventTypeFilter button").remove();
	$("#eventTypeFilter").append("<button class='btn btn-primary all' type='button'>" + _allTypeFilterValue + "</button>");

	$("#eventContent").html("");
}
function fillEventsFilterValues(){
	$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.AllEvents) + "</option>");
	$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.Current:_eventStatusValues.Current) + "</option>");
	$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.Upcoming:_eventStatusValues.Upcoming) + "</option>");
	$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.Completed:_eventStatusValues.Completed) + "</option>");
	$("#filterStatusContent").selectpicker({
		style: "btn-light",
		width: "100%",
	});

	let newCtx = SP.ClientContext.get_current();

	let newEventList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleEvents);
	let newEventCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query><RowLimit>1000</RowLimit></View>";
	newEventCamlQuery.set_viewXml(query);
	let newListItems = newEventList.getItems(newEventCamlQuery);

	let newEventTypeList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleEventTypes);
	let newEventTypeListItems=newEventTypeList.getItems(SP.CamlQuery.createAllItemsQuery());

	newCtx.load(newListItems);
	newCtx.load(newEventTypeListItems);
	newCtx.executeQueryAsync(function(){
		let newEventTypes = [];
		for (let i = 0; i < newEventTypeListItems.get_count(); i++) {
			let eachItem = newEventTypeListItems.getItemAtIndex(i);
			let temp = {};
			temp.ID = eachItem.get_item('ID');
			temp.Title = eachItem.get_item('Title');
			temp.EventTypeArabic = eachItem.get_item('EventTypeArabic');
			newEventTypes.push(temp);
		}
		for(let i=0;i<newListItems.get_count();i++){
			let eachEvent = newListItems.getItemAtIndex(i);

			let newEventType = eachEvent.get_item("EventTypeLookup");
			if (newEventType){
				let eventTypeID=newEventType.get_lookupId();
				let itemEventTypes=newEventTypes.find(x=>x.ID==eventTypeID);
				if(itemEventTypes){
					let finalValue=isArabic?itemEventTypes.EventTypeArabic:itemEventTypes.Title;
					let typeID=itemEventTypes.ID;
					if($("#eventTypeFilter button:contains('"+finalValue+"')").length==0)
						$("#eventTypeFilter").append("<button data-typeId='"+typeID+"' class='btn btn-light' type='button'>"+finalValue+"</button>");
				}
			}
		}
		bindFilterEvents();
	},failure);
}
function bindFilterEvents() {
	$("#eventTypeFilter button").on("click", function () {
		isRefreshData=true;
		$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-light");
		$(this).toggleClass("btn btn-light btn btn-primary");

		let allSelectedValues = [];
		$("#eventTypeFilter button.btn-primary").each(function (index, item) {
			allSelectedValues.push($(item).text());
		});

		if (allSelectedValues.length == 0)
			$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		if (allSelectedValues.indexOf(_allTypeFilterValue) > -1) {
			$("#eventTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
			$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		}
		filterContent();
	});

	$('#filterStatusContent').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
		isRefreshData=true;
		filterContent();
	});

	$("#anchorResetFilter").on("click",function(){
		isRefreshData=true;
		$("#eventTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
		$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		$('#filterFromDate,#filterEndDate').val("")
		//Below changes fire event automatically.
		$('#filterStatusContent').selectpicker('val', isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.AllEvents);
	});

	$('#filterFromDate,#filterEndDate').datepicker().on('changeDate', function (ev) {
		isRefreshData=true;
		filterContent();
	});

	$("#anchorToday").on("click", function () {
		isRefreshData=true;
		let today = getFormattedDate(new Date());
		$("#filterFromDate").val(getFormattedDate(today));
		$("#filterEndDate").val(getFormattedDate(today));
		filterContent();
	});

	$("#anchorWeek").on("click", function () {
		isRefreshData=true;
		let date = new Date();
		getWeekRange(date, function (weekStartDate, weekEndDate) {
			$("#filterFromDate").val(weekStartDate);
			$("#filterEndDate").val(weekEndDate);
			filterContent();
		});
	});

	$("#anchorMonth").on("click", function () {
		isRefreshData=true;
		let date = new Date();
		getMonthRange(date, function (monthStartDate, monthEndDate) {
			$("#filterFromDate").val(monthStartDate);
			$("#filterEndDate").val(monthEndDate);
			filterContent();
		});
	});
}

function filterContent(){

	let finalQuery=[];

	let eventTypeFilterValues = [];
	$("#eventTypeFilter button.btn-primary").each(function (index, item) {
		let typeId=$(item).attr("data-typeId");
		let typeText=$(item).text();
		if(typeId && typeText !=_allTypeFilterValue){
			let tempQuery="";
			tempQuery = "<Eq><FieldRef Name='EventTypeLookup' LookupId='TRUE'/>";
			tempQuery += "<Value Type='Lookup'>"+typeId+"</Value>";
			tempQuery += "</Eq>";
			eventTypeFilterValues.push(tempQuery);
		}
	});
	let eventTypeFilterStr=generateCamlQuery(eventTypeFilterValues,"or");
	if(eventTypeFilterStr)
		finalQuery.push(eventTypeFilterStr);

	let allStatusValue=isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.AllEvents;
	let currentStatusValue=isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.Current;
	let completedStatusValue=isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.Completed;
	let upcomingStatusValue=isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.Upcoming;

	let statusFilterValues=[];
	var statusValue = $("#filterStatusContent").val();
	if (statusValue && statusValue != allStatusValue) {
		let today = new Date();
		today =today.getFullYear()+"-"+(today.getMonth()+1)+"-"+('0' + today.getDate()).slice(-2);

		let tempFromQuery = "";
		let tempToQuery = "";
		
		if (statusValue == currentStatusValue) {
			tempFromQuery = "<Leq><FieldRef Name='EventStartDate' />";
			tempFromQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + today + "</Value>";
			tempFromQuery += "</Leq>";
			statusFilterValues.push(tempFromQuery);

			tempToQuery = "<Geq><FieldRef Name='EventEndDate' />";
			tempToQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + today + "</Value>";
			tempToQuery += "</Geq>";
			statusFilterValues.push(tempToQuery);
		}
		if (statusValue == completedStatusValue) {
			tempFromQuery = "<Lt><FieldRef Name='EventStartDate' />";
			tempFromQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + today + "</Value>";
			tempFromQuery += "</Lt>";
			statusFilterValues.push(tempFromQuery);

			tempToQuery = "<Lt><FieldRef Name='EventEndDate' />";
			tempToQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + today + "</Value>";
			tempToQuery += "</Lt>";
			statusFilterValues.push(tempToQuery);
		}
		if (statusValue == upcomingStatusValue) {
			tempFromQuery = "<Gt><FieldRef Name='EventStartDate' />";
			tempFromQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + today + "</Value>";
			tempFromQuery += "</Gt>";
			statusFilterValues.push(tempFromQuery);

			tempToQuery = "<Gt><FieldRef Name='EventEndDate' />";
			tempToQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + today + "</Value>";
			tempToQuery += "</Gt>";
			statusFilterValues.push(tempToQuery);
		}
	}
	let statusFilterStr=generateCamlQuery(statusFilterValues,"and");
	if(statusFilterStr)
		finalQuery.push(statusFilterStr);
	
	let tempFromQuery="";
	let fromDateStr = $("#filterFromDate").val();
	if (fromDateStr) {
		let fromDate = getFilterDate(fromDateStr);
		tempFromQuery = "<Geq><FieldRef Name='EventStartDate' />";
		tempFromQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + fromDate + "</Value>";
		tempFromQuery += "</Geq>";
		finalQuery.push(tempFromQuery);
	}

	let tempToQuery="";
	let toDateStr = $("#filterEndDate").val();
	if (toDateStr) {
		let toDate = getFilterDate(toDateStr);
		tempToQuery = "<Leq><FieldRef Name='EventEndDate' />";
		tempToQuery += "<Value IncludeTimeValue='FALSE' Type='DateTime'>" + toDate + "</Value>";
		tempToQuery += "</Leq>";
		finalQuery.push(tempToQuery);
	}
	
	let whereQuery = "<Where>";
	whereQuery += generateCamlQuery(finalQuery,"and");;
	whereQuery += "</Where>";
	bindEventData(whereQuery);
}

function setupLanguage(){
	$("#sectionTitleAuthor").text(isArabic?"أبرز المؤلفين":"Featured Authors");
	$("#btnApplyFilter,#applyFilter2").text(isArabic?"تطبيق الفلاتر":"Apply Filters");

	$("#titleYearFilter").text(isArabic?"التصفية حسب السنة":"Filter By Year");
	$("#titleAuthorFilter").text(isArabic?"تصفية حسب المؤلف":"Filter By Author");
	$("#titleTypeFilter").text(isArabic?"تصفية حسب الموضوع":"Filter By Type");

	$("#resetFilter").text(isArabic?"إعادة تعيين الفلاتر":"Reset Filters");
	$("#backText").text(isArabic?"عودة":"Back");
}

function htmlDesignResult(eachEvent){
	let htmlDesign={};

	let eventStartDateArr = getFormattedDate(eachEvent.EventStartDate).split(" ");
	let eventEndDateArr = getFormattedDate(eachEvent.EventEndDate).split(" ");
	let EventDesc =SlicingDesc(eachEvent.EventDesc);
	let eventDetailLink= _siteUrl +(isArabic?"/ar/pages/":"/Pages/") + "EventDetails.aspx?ItemID=" + eachEvent.ID;

	let EventTypeLookup=eachEvent.EventTypeIDs.Title;
	let eventTitle=isArabic?eachEvent.EventArabicTitle:eachEvent.Title;
	let imageUrl=eachEvent.ImageUrl;

	htmlDesign.FutureEvent="<div class='event-list-item'>" +
							"<div class='row'>" +
							"<div class='col-lg-3'>" +
							"<a href='"+eventDetailLink+"' class='event-list-item-img'>" +
							"<img src='" + imageUrl + "'>" +
							"</a>" +
							"</div>" +
							"<div class='col-lg-5'>" +
							"<div class='event-list-content'>" +
							"<p class='event-category'>" + EventTypeLookup + "</p>" +
							"<a href='"+eventDetailLink+"'>" +
							"<h2>" + eventTitle + "</h2>" +
							"</a>" +
							"<p>" + EventDesc + "</p>" +
							"</div>" +
							"</div>" +
							"<div class='col-5 col-lg-2'>" +
							"<div class='event-item-date'>" +
							"<div class='event-item-date-fromto'>" +
							"<div class='event-item-date-day'>" + eventStartDateArr[0] + "</div>" +
							"<div class='event-item-date-month'>" + eventStartDateArr[1] + "</div>" +
							"</div>" +
							"<span>-</span>" +
							"<div class='event-item-date-fromto'>" +
							"<div class='event-item-date-day'>" + eventEndDateArr[0] + "</div>" +
							"<div class='event-item-date-month'>" + eventEndDateArr[1] + "</div>" +
							"</div>" +
							"</div>" +
							"</div>" +
							"<div class='col-7 col-lg-2'>" +
							"<a href='"+eventDetailLink+"' class='btn btn-primary go-button'>Register</a>" +
							"</div>" +
							"</div>" +
							"</div>";
	htmlDesign.pastEvent="<div class='event-list-item past-event'>" +
							"<div class='row'>" +
							"<div class='col-lg-3'>" +
							"<div class='event-img'>" +
							"<a href='"+eventDetailLink+"' class='event-list-item-img'>" +
							"<img src='" + imageUrl + "'>" +
							"<span>Past Event</span>" +
							"</a>" +
							"</div>" +
							"</div>" +
							"<div class='col-lg-5'>" +
							"<div class='event-list-content'>" +
							"<p class='event-category'>" + EventTypeLookup + "</p>" +
							"<a href='"+eventDetailLink+"'>" +
							"<h2>" + eventTitle + "</h2>" +
							"</a>" +
							"<p>" + EventDesc + "</p>" +
							"</div>" +
							"</div>" +
							"<div class='col-5 col-lg-2'>" +
							"<div class='event-item-date'>" +
							"<div class='event-item-date-fromto'>" +
							"<div class='event-item-date-day'>" + eventStartDateArr[0] + "</div>" +
							"<div class='event-item-date-month'>" + eventStartDateArr[1] + "</div>" +
							"</div>" +
							"<span>-</span>" +
							"<div class='event-item-date-fromto'>" +
							"<div class='event-item-date-day'>" + eventEndDateArr[0] + "</div>" +
							"<div class='event-item-date-month'>" + eventEndDateArr[1] + "</div>" +
							"</div>" +
							"</div>" +
							"</div>" +
							"<div class='col-7 col-lg-2'>" +
							"<a href='"+eventDetailLink+"' class='go-link'>VIEW DETAILS</a>" +
							"</div>" +
							"</div>" +
							"</div>";
	return htmlDesign;
}

function getFilterDate(sourceDateStr){
	if(sourceDateStr){
		let checkDate=new Date(sourceDateStr);
		return checkDate.getFullYear()+"-"+(checkDate.getMonth()+1)+"-"+('0' + checkDate.getDate()).slice(-2);
	}
	else
		return "";
}