"use strict";
var _siteUrl = "";
var _researchCollection = [];
var _researchListDetails = [];
$(document).ready(function () {
	document.title = "Research Theme";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', researchStart);
});

function researchStart() {
    var urlForResearchList = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleResearch+"')";
    var get_ResearchList = SPRestCommon.GetItemAjaxCall(urlForResearchList);

    var urlForResearch = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleResearch+"')/items?$top=1000";
    var get_Research = SPRestCommon.GetItemAjaxCall(urlForResearch);
	
    $.when(get_ResearchList,get_Research)
    .then(function (respResearchList, respResearch) {
		
		try {
			_researchListDetails = respResearchList[0].d;
			$("#contentListTitle").text(_researchListDetails.Title);
			$("#contentListDesc").text(_researchListDetails.Description);
		} catch (error) {
			console.error(error);
		}
		_researchCollection=respResearch[0].d.results;
		for(let i=0;i<_researchCollection.length;i++){
			getImageUrl(_researchCollection[i],i,function(resultImgUrl,eachResult){
				var eachResearchContent="<a href='"+_siteUrl+"/Pages/ResearchDetails.aspx?ItemID="+eachResult.ID+"'>"+
											"<div class='post-list-item'>"+
												"<div class='row'>"+
													"<div class='col-lg-4'>"+
														"<div class='post-list-item-img'>"+
															"<img src='"+resultImgUrl+"'>"+
														"</div>"+
													"</div>"+
													"<div class='col-lg-8'>"+
														"<div class='post-list-content'>"+
															"<h2>"+eachResult.Title+"</h2>"+
															"<p>"+eachResult.PlainDesc+"</p>"+
															"<span class='go-link'>LEARN MORE</span>"+
														"</div>"+
													"</div>"+
												"</div>"+
											"</div>"+
										"</a>";
				$("#searchThemeContent").append(eachResearchContent);
			},function(err){
				console.error(err);
			});
		}
	}).fail(CommonUtil.OnRESTError);
}