"use strict";
var _siteUrl = "";
var _currentResearch = [];
var _latestResearchcollection = [];
var _currentStaffCollection=[];

var _latestEventcollection = [];
var _eventCounter=4;

var _publicationCounter=0;
var _publicationContentArr=[];
var _alreadyBindCountPublication=0;
var _publicationLoadMoreCount=2;

$(document).ready(function () {
	document.title = "Research Details";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', researchStart);
});

function researchStart() {
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID');
	if(itemID !=null){
		var urlForCurrentResearch = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleResearch+"')/items(" + itemID + ")?"+
									"$select=ID,Title,PlainDesc,ResearchTag,ContentWriterName/Title,ContentWriterName/ID,FieldValuesAsHtml" +
									"&$expand=ContentWriterName";
		var get_Current_Research = SPRestCommon.GetItemAjaxCall(urlForCurrentResearch);
		
		var urlForLatestResearch = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleResearch+"')/items?$top=3&$orderby=Modified desc";
		var get_LatestResearch = SPRestCommon.GetItemAjaxCall(urlForLatestResearch);

		var urlForLatestEvent = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleEvents+"')/items?$top=1000&$orderby=Modified desc";
		var get_LatestEvent = SPRestCommon.GetItemAjaxCall(urlForLatestEvent);

		$.when(get_Current_Research,get_LatestResearch,get_LatestEvent)
		.then(function (respCurrentResearch,respLatestResearch,respLatestEvent) { 

			_currentResearch=respCurrentResearch[0].d;
			$("#currentTitleNav,#currentTitleHeading,#currentTitleBlock").text(_currentResearch.Title);
			$("#currentReasearchContent").html(_currentResearch.PlainDesc);

			let staffValArr=_currentResearch.ContentWriterName.results;
			let staffIDs="";
			for(let i=0;i<staffValArr.length;i++){
				staffIDs+=staffValArr[i].ID+",";
			}
			if(staffIDs){
				getStaffByCommaSaperateIDs(staffIDs,0,function(staffCollectionResult,otherObject){
					_currentStaffCollection=staffCollectionResult;
					for(let i=0;i<_currentStaffCollection.length;i++){
						let eachStaff=_currentStaffCollection[i];
						var eachStaffDetail="<div class='author-item'>"+
													"<img src='"+eachStaff.ProfileImageUrl+"' />"+
													"<div>"+
														"<a href='"+eachStaff.ProfileDetailPageURL+"'>"+
														"<h4>"+eachStaff.Title+"</h4>"+
														"</a>"+
														"<p>"+eachStaff.StaffPostion+"</p>"+
													"</div>"+
												"</div>";
						$("#staffDetails").append(eachStaffDetail);
						var carouselItemDetail="<div class='item'>"+
													"<a href='"+eachStaff.ProfileDetailPageURL+"'>"+
														"<div class='key-researcher'>"+
															"<div class='key-researcher-img'>"+
																"<img src='"+eachStaff.ProfileImageUrl+"' />"+
															"</div>"+
															"<h4>"+eachStaff.Title+"</h4>"+
															"<p>"+eachStaff.StaffPostion+"</p>"+
														"</div>"+
													"</a>"+
												"</div>";
						$("#staffCarouselDetails").append(carouselItemDetail);
					}
					createOwlSlider();
				});
			}

			_latestResearchcollection=respLatestResearch[0].d.results;
			for(let i=0;i<_latestResearchcollection.length;i++){
					let researchDetailUrl=_siteUrl+"/Pages/ResearchDetails.aspx?ItemID="+_latestResearchcollection[i].ID;
					var eachResearchTitle="<div class='related-list-item'>"+
												"<a href='"+researchDetailUrl+"'>"+
													"<p class='related-title'>"+_latestResearchcollection[i].Title+"</p>"+
												"</a>"+
											"</div>";
					$("#latestResearch").append(eachResearchTitle);
			}

			bindEventSection(respLatestEvent);
			
			bindLoadMoreEvents();

		}).fail(CommonUtil.OnRESTError);

		bindPublication();
	}
}

function bindEventSection(respLatestEvent){
	_latestEventcollection=respLatestEvent[0].d.results;
	let allEventsUrl=_siteUrl+"/Pages/Events.aspx";
	$("#AllEventAnchor").attr("href",allEventsUrl);
	for(let i=0;i<_latestEventcollection.length;i++){
		if(i==4)
			break;
		else{
			getImageUrl(_latestEventcollection[i],i,function(resultImgUrl,eachEvent){
				bindEachEventSection(resultImgUrl,eachEvent);
			});
		}
	}

	if(_latestEventcollection.length>4)
		$("#eventReadMore").show();
	else
		$("#eventReadMore").hide();
}

function bindEachEventSection(resultImgUrl,eachEvent){
	let eventDetailUrl=_siteUrl+"/Pages/EventDetails.aspx?ItemID="+eachEvent.ID;
	let eventStartDateArr=getFormattedDate(eachEvent.EventStartDate).split(" ");
	let eventEndDateArr=getFormattedDate(eachEvent.EventEndDate).split(" ");
	let eachEventDetails="<div class='col-lg-6'>"+
								"<div class='related-event'>"+
									"<a href='"+eventDetailUrl+"'>"+
										"<div class='row'>"+
											"<div class='col-5 col-lg-6'>"+
												"<div class='related-event-img'>"+
													"<img src='"+resultImgUrl+"' />"+
												"</div>"+
												"<p class='related-events-date d-lg-none'>"+eventStartDateArr[0]+" "+eventStartDateArr[1]+" - "+eventEndDateArr[0]+" "+eventEndDateArr[1]+"</p>"+
											"</div>"+
											"<div class='col-7 col-lg-6  pl-xs-0'>"+
												"<div class='related-events-content'>"+
													"<p class='related-events-category'>"+eachEvent.EventType1+"</p>"+
													"<h3 class='related-events-title'>"+eachEvent.Title+"</h3>"+
													"<p class='related-events-date d-none d-lg-block'>"+eventStartDateArr[0]+" "+eventStartDateArr[1]+" - "+eventEndDateArr[0]+" "+eventEndDateArr[1]+"</p>"+
												"</div>"+
											"</div>"+
										"</div>"+
									"</a>"+
								"</div>"+
							"</div>";
	$("#eventDetailContent").append(eachEventDetails);
}

function bindLoadMoreEvents(){
	$("#eventReadMore").on("click",function(){
		for(let i=_eventCounter;i<_latestEventcollection.length;i++)
		{
			_eventCounter++;
			if(i==(_eventCounter+4))
				break;
			else{
				getImageUrl(_latestEventcollection[i],i,function(resultImgUrl,eachEvent){
					bindEachEventSection(resultImgUrl,eachEvent);
				},function(err){
					console.error(err);
				});
			}
		}
		if(_eventCounter==_latestEventcollection.length)
			$("#eventReadMore").hide();
		else
			$("#eventReadMore").show();
	});
}

function bindPublication(){

	let allPublicationUrl=_siteUrl+"/Pages/Publication.aspx";
	$("#allPublicationAnchor").attr("href",allPublicationUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_web().get_lists().getByTitle(_listTitlePublication);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query></View>";
	camlQuery.set_viewXml(query);

	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function(){
		
		for(let i=0;i<items.get_count();i++){
			let eachPublication = items.getItemAtIndex(i);

			let pubAuthIDsArr=[];
			var pubAuthorIDs = eachPublication.get_item('PublicationAuthorIDs');
			for(let j = 0;j < pubAuthorIDs.length;j++) {
				pubAuthIDsArr.push(pubAuthorIDs[j].get_lookupId());
			}
			if(pubAuthIDsArr.length>0){
				let tempObj={};
				tempObj.Index=i;
				tempObj.eachPublication=eachPublication;
				getStaffByIDArray(ctx,pubAuthIDsArr,tempObj,function(staffCollection, tempObj){
					_publicationCounter++;
					if(staffCollection.length>0){
						tempObj.staffCollection=staffCollection;
						fillPublicationDetails(tempObj);
					}
					if(_publicationCounter==items.get_count())
						bindPublicationHtml();
				},function(err){
					console.error(err);
				});
			}
		}

		if(items.get_count()>_publicationLoadMoreCount)
			$("#publicationReadMore").show();
		else
			$("#publicationReadMore").hide();		

	},function(err){
		console.error(err);
	});

	$("#publicationReadMore").on("click",function(){
		bindPublicationHtml();
	});
}

function fillPublicationDetails(tempObj){

	let eachPublication=tempObj.eachPublication;

	let publicationDetailUrl=_siteUrl+"/Pages/PublicationDetails.aspx?ItemID="+eachPublication.get_item('ID');
	let pubDetails=$("<div></div>").append(eachPublication.get_item('PublicationDetails'));
	let pubTitle=SlicingTitle(eachPublication.get_item('Title'));
	let pubCategory=eachPublication.get_item('PublicationTopicIDs').get_lookupValue();
	let pubImageUrl=getImageSrcValue(eachPublication.get_fieldValues()['ImageUrl']);

	let staffCollection=tempObj.staffCollection;

	let contentHtml="";
	if(tempObj.Index==0){
	 	contentHtml="<div class='col-lg-8'>"+
									"<a href='"+publicationDetailUrl+"'>"+
										"<div class='publication publication-big'>"+
											"<div class='publication-content'>"+
												"<p class='publication-category'>"+pubCategory+"</p>"+
												"<h3 class='publication-title'>"+pubTitle+"</h3>"+
												"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
												"<div class='publication-author'>"+
													"<img src='"+staffCollection[0].ProfileImageUrl+"' alt='...'>"+
													"<span>by "+staffCollection[0].Title+"</span>"+
												"</div>"+
											"</div>"+
											"<div class='publication-img'>"+
												"<img src='"+pubImageUrl+"' alt='...'>"+
											"</div>"+
										"</div>"+
									"</a>"+
								"</div>";
	}
	else{
		 contentHtml="<div class='col-lg-4'>"+
									"<div class='publication'>"+
										"<a href='"+publicationDetailUrl+"'>"+
											"<div class='publication-content'>"+
												"<p class='publication-category'>"+pubAuthor+"</p>"+
												"<h3 class='publication-title'>"+pubTitle+"</h3>"+
												"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
												"<div class='publication-author'>"+
													"<img src='"+staffCollection[0].ProfileImageUrl+"' alt='...'>"+
													"<span>by "+staffCollection[0].Title+"</span>"+
												"</div>"+
											"</div>"+
										"</a>"+
									"</div>"+
								"</div>";
	}
	let contentObj={};
	contentObj.Index=tempObj.Index;
	contentObj.Content=contentHtml;
	_publicationContentArr.push(contentObj);
}

function bindPublicationHtml(){
	let oldBindCountValue=_alreadyBindCountPublication;
	let newBindLimit=oldBindCountValue+_publicationLoadMoreCount;
	let sortByIndex=_publicationContentArr.sort(function(a,b) {
						return a.Index - b.Index;
						});
	for(let i=oldBindCountValue;i<sortByIndex.length;i++){
		if(i==newBindLimit)
			break;
		_alreadyBindCountPublication++;
		$("#publicationSection").append(sortByIndex[i].Content);
	}

	if(sortByIndex.length>_alreadyBindCountPublication)
			$("#publicationReadMore").show();
		else
			$("#publicationReadMore").hide();
}

