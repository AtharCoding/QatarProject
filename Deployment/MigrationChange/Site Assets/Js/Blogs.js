"use strict";
var _siteUrl = "";
var _blogsCollection = [];
var _interviewCollection = [];
var _articleCollection = [];
var _blogListDetails = [];
var _interviewActiveIndex = 3;
var articleActiveIndex = 3;

var _blogDetails = [];
var _articleDetails = [];
var _interviewDetails = [];

$(document).ready(function () {
	document.title = "Blogs";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', blogsStart);
});

function blogsStart() {
	fillLanguageData();
	
	var urlForBlogs = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')/items?" +
		"$select=ID,Title,BlogArabicTitle,ContentDate,BlogContent,BlogContentArabic,IsFeatured1,IsVideo,VideoUrl,FieldValuesAsHtml," +
		"ContentWriterName/Title,ContentWriterName/ID,ContentWriterName/StaffArabicTitle,BlogTypeLookup/ID,BlogTypeLookup/Title,BlogTypeLookup/BlogTypeArabic"+
		"&$expand=ContentWriterName,BlogTypeLookup" +
		"&$top=1000&$orderby=IsVideo desc,Modified desc";
	var get_Blogs = SPRestCommon.GetItemAjaxCall(urlForBlogs);

	$.when(get_Blogs)
		.then(function (respBlogs) {
			getListDetails(_listTitleBlogs);
			
			var fullBlogData = respBlogs.d.results;
			for (let i = 0; i < fullBlogData.length; i++) {
				let eachBlog = fullBlogData[i];
				if (eachBlog.BlogTypeLookup.Title == "Blog") {
					_blogsCollection.push(eachBlog);
				}
				if (eachBlog.BlogTypeLookup.Title == "TV Interview") {
					_interviewCollection.push(eachBlog);
				}
				if (eachBlog.BlogTypeLookup.Title == "Editorial & Article") {
					_articleCollection.push(eachBlog);
				}
			}

			bindBlogs();

			// Binding TV Interviews
			try {
				for (let i = 0; i < _interviewCollection.length; i++) {
					if (i == 3)
						break;
					else {
						getImageUrl(_interviewCollection[i], i, function (resultImgUrl, eachInterview) {
							var eachInterviewContent = getInterviewHtml(resultImgUrl, eachInterview);
							$("#tvInterviewContent").append(eachInterviewContent);
						}, failure);
					}
				}
			} catch (error) {
				console.error(error);
			}

			// Binding Articles
			try {
				for (let i = 0; i < _articleCollection.length; i++) {
					if (i == 3)
						break;
					else {
						getImageUrl(_articleCollection[i], i, function (resultImgUrl, eachArticle) {
							var eachArticleContent = getArticleHtml(resultImgUrl, eachArticle);
							$("#articleContent").append(eachArticleContent);
						}, failure);
					}
				}
			} catch (error) {
				console.error(error);
			}

			$("#tvInterviewLoadMore").toggle(_interviewCollection.length > 3);
			$("#articleLoadMore").toggle(_articleCollection.length > 3);

			bindLoadMoreEvents();
		}).fail(CommonUtil.OnRESTError);
	
	//For sharing site
	let metaTitle="Blogs";
	let metaDesc="Motife Blogs";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function getArticleHtml(resultImgUrl, eachArticle){
	let finalTitle = isArabic ? SlicingTitle(eachArticle.BlogArabicTitle): SlicingTitle(eachArticle.Title);
	let finalBlogContent = isArabic ? SlicingDesc(eachArticle.BlogContentArabic): SlicingDesc(eachArticle.BlogContent);
	let blog_detail_url = _siteUrl + "/Pages/" + (isArabic ? "ar/" : "") + "BlogDetails.aspx?ItemID=" + eachArticle.ID;
	let writerName=isArabic?"بواسطة "+eachArticle.ContentWriterName.results[0].StaffArabicTitle:"By "+eachArticle.ContentWriterName.results[0].Title;
	var eachArticleContent = "<div class='col-lg-4'>" +
								"<a href='" + blog_detail_url + "'>" +
									"<div class='card'>" +
										"<div class='card-img'>" +
											"<img src='" + resultImgUrl + "' alt='...'>" +
											"<span class='card-date'>" + getFormattedDate(eachArticle.ContentDate) + "</span>" +
										"</div>" +
										"<div class='card-body'>" +
											"<h5 class='card-title'>" + finalTitle + "</h5>" +
											"<p class='card-text'>" + finalBlogContent + "</p>" +
										"</div>" +
										"<div class='card-footer'>" +
											"<p>"+writerName+"</p>" +
										"</div>" +
									"</div>" +
								"</a>" +
							"</div>";
	return eachArticleContent;
}

function getInterviewHtml(resultImgUrl, InterviewItem){
	let finalTitle = isArabic ? SlicingTitle(InterviewItem.BlogArabicTitle): SlicingTitle(InterviewItem.Title);
	let blog_detail_url = _siteUrl + "/Pages/" + (isArabic ? "ar/" : "") + "BlogDetails.aspx?ItemID=" + InterviewItem.ID;
	let writerName=isArabic?"بواسطة "+InterviewItem.ContentWriterName.results[0].StaffArabicTitle:"By "+InterviewItem.ContentWriterName.results[0].Title;
	var eachInterviewContent="<div class='col-lg-4'>"+
														"<a href='" + blog_detail_url + "'>"+
															"<div class='video-card'>"+
																"<div class='video-card-img'>"+
																	"<img src='"+resultImgUrl+"' alt=''>"+
																	"<button class='open-video'><i class='fas fa-caret-right'></i></button>"+
																"</div>"+
																"<div class='video-card-content'>"+
																	"<p class='video-card-date'>"+getFormattedDate(InterviewItem.ContentDate)+"</p>"+
																	"<h4>"+ finalTitle +"</h4>"+
																	"<p>"+writerName+"</p>"+
																"</div>"+
															"</div>"+
														"</a>"+
													"</div>";
	return eachInterviewContent;
}

function bindLoadMoreEvents(){
	$("#tvInterviewLoadMore").on("click",function(){
		for(let i=_interviewActiveIndex;i<_interviewCollection.length;i++)
		{
			_interviewActiveIndex++;
			if(i==(_interviewActiveIndex+3))
				break;
			else{
				getImageUrl(_interviewCollection[i], i, function(resultImgUrl,eachInterview){
					let eachInterviewContent = getInterviewHtml(resultImgUrl,eachInterview);
					$("#tvInterviewContent").append(eachInterviewContent);
				},failure);
			}
		}
		
		$("#tvInterviewLoadMore").toggle(!(_interviewActiveIndex == _interviewCollection.length));
		
	});

	$("#articleLoadMore").on("click",function(){
		for(let i=articleActiveIndex;i<_articleCollection.length;i++)
		{
			articleActiveIndex++;
			if(i==(articleActiveIndex+3))
				break;
			else{
				getImageUrl(_articleCollection[i],i,function(resultImgUrl,eachArticle){
					let eachArticleContent=getArticleHtml(resultImgUrl,eachArticle);
					$("#articleContent").append(eachArticleContent);
				},failure);
			}
		}
		
		$("#articleLoadMore").toggle(!(articleActiveIndex==_articleCollection.length));
		
	});
}

var _blogCounter=0;
var _totalBlogCount=0;
var _blogCollections=[];
function bindBlogs(){
	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleBlogs);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "<Where><Eq><FieldRef Name='BlogTypeLookup' />";
	query += "<Value Type='Lookup'>Blog</Value>";
	query += "</Eq></Where>";
	query += "</Query></View>";
	camlQuery.set_viewXml(query);

	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function(){
		_totalBlogCount=items.get_count();
		for(let i=0;i<_totalBlogCount;i++){
			let eachBlog = items.getItemAtIndex(i);

			let pubAuthIDsArr=[];
			var pubAuthorIDs = eachBlog.get_item('ContentWriterName');
			for(let j = 0;j < pubAuthorIDs.length;j++) {
				pubAuthIDsArr.push(pubAuthorIDs[j].get_lookupId());
			}
			if(pubAuthIDsArr.length>0){
				let tempObj={};
				tempObj.Index=i;
				tempObj.eachBlog=eachBlog;
				getStaffDetailsByQuery(createCamlQueryByIDArr(pubAuthIDsArr),tempObj,function(staffCollection, tempObj){
					_blogCounter++;
					if(staffCollection.length>0){
						tempObj.staffCollection=staffCollection;
						_blogCollections.push(tempObj);
					}
					if(_blogCounter==_totalBlogCount)
						fillBlogDetails();
				},failure);
			}
		}
	},failure);
}

function fillBlogDetails(){
	_blogCollections.sort(function(a,b) {return a.Index - b.Index;});
	for(let i=0;i<_blogCollections.length;i++){
		let eachBlog=_blogCollections[i].eachBlog;
		let index=_blogCollections[i].Index;
		let staffCollection=_blogCollections[i].staffCollection;
		let writerName=isArabic?"بواسطة "+staffCollection[0].Title:"By "+staffCollection[0].Title;

		let blogDetailUrl = _siteUrl + "/Pages/" + (isArabic ? "ar/" : "") + "BlogDetails.aspx?ItemID=" + eachBlog.get_item('ID');
		let blogDesc=$("<div></div>").append(eachBlog.get_item(isArabic ? 'BlogContentArabic' : 'BlogContent')).text();
		let blogTitle=SlicingTitle(eachBlog.get_item(isArabic ? 'BlogArabicTitle' : 'Title'));
		
		let blogDate="";
		let contentDate=eachBlog.get_item('ContentDate');
		if(contentDate)
			blogDate=getFormattedDate(contentDate);
	
		let pubImageUrl=getImageSrcValue(eachBlog.get_fieldValues()['ImageUrl']);
		
		$("#content" + index  + "Anchor").hide();
		$("#content" + index  + "Img").attr("src", pubImageUrl);
		$("#content" + index  + "Date").text(blogDate);
		$("#content" + index  + "Title").text(blogTitle);
		$("#content" + index  + "Desc").text(SlicingDesc(blogDesc));
		$("#content" + index  + "Anchor").attr("href", blogDetailUrl);
		$("#content" + index  + "WriterName").text(writerName);
		$("#content" + index  + "Anchor").show();
	}
}

function fillLanguageData(){
	$("#TVInterviewSectionTitle").text(isArabic?"مقابلة تلفزيونية":"TV Interviews");
	$("#EditorSectionTitle").text(isArabic?"التحرير والمقال":"Editorials & Articles");
	$("#twitterWidgetTitle").text(isArabic?"اتصل بنا":"Connect with Us");
	$("#twitterAnchor").text(isArabic?"عرض المزيد Twitter":"VIEW MORE IN OUR TWITTER");
}