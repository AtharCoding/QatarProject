var spBootstrapList = function(){
    
    var _totalRecords = 0;
    var _positions;
    var _faqs = Array();
    var _filterByList = Array();
    var _filterByListUnique = Array();
    var _filterByValues = Array();

    var _errors = Array();
    var _firstLoad = true;

    var _settings = {        
        instance : "spBL233565656", //required !!
        listName :'News',
        ID       :'ID',   
        Title :"Title", 
        NewsDate :'NewsDate',
        PlainDesc:'PlainDesc',
        ImageUrl:'ImageUrl',
        rowLimit :6, 
        title : "Title", 
        showDate : true
    };   


    if(arguments.length > 0 && typeof arguments == 'object'){

        //instance name is required//
        if(arguments[0].hasOwnProperty("instance") == true){
            _settings.instance = arguments[0].instance;
        }else{
            console.log('Internal error: Missing required instance name');
            return false;
        }

        if(arguments[0].hasOwnProperty("listName") == true){
            _settings.listName = arguments[0].listName;
        };
        if(arguments[0].hasOwnProperty("ID") == true){
            _settings.question = arguments[0].ID;
        };
        if(arguments[0].hasOwnProperty("Title") == true){
            _settings.answer = arguments[0].Title;
        };
        if(arguments[0].hasOwnProperty("PlainDesc") == true){
            _settings.question = arguments[0].PlainDesc;
        };
        if(arguments[0].hasOwnProperty("ImageUrl") == true){
            _settings.question = arguments[0].ImageUrl;
        };
        
        if(arguments[0].hasOwnProperty("NewsDate") == true){
            _settings.answer = arguments[0].NewsDate;
        };
        if(arguments[0].hasOwnProperty("filterBy") == true){
            _settings.filterBy = arguments[0].filterBy;
        };
        
        if(arguments[0].hasOwnProperty("rowLimit") == true){
            var n = arguments[0].rowLimit;

            if(!isNaN(parseFloat(n)) && isFinite(n)){ // check if number
                if(arguments[0].rowLimit >= 3){ //cannot be lower than 3
                    _settings.rowLimit = arguments[0].rowLimit;
                }else{
                    console.log("Row limit cannot be lower than 3, going back to default limit");
                }
            }else{
                console.log("Row limit is not a number, going back to default limit");
            }
        };

        //optional args: 
        //showDate
        if(arguments[0].hasOwnProperty("showDate") == true){
            if(typeof arguments[0].showDate == 'boolean'){
                _settings.showDate = arguments[0].showDate;
            }else{
                console.log("showDate is not valid. setting to false");
                _settings.showDate = false;
            }
        };
    }

    //public methods
    //accessible inside via function();

    var init = function(){
        var ajax = methods.callSPServices(_settings.rowLimit, true);  

        $(ajax.responseXML).SPFilterNode("z:row").each(function(e) { 
                      
            var errors = Array();
          
            if(typeof $(this).attr('ows_' + _settings.ID) == 'undefined'){
                errors.push("Invalid field name for ID: " + _settings.ID);
            }
            if(typeof $(this).attr('ows_' + _settings.Title) == 'undefined'){
                errors.push("Invalid field name for Title: " + _settings.Title);
            }
            if(typeof $(this).attr('ows_' + _settings.PlainDesc) == 'undefined'){
                errors.push("Invalid field name for PlainDesc: " + _settings.PlainDesc);
            }
            if(typeof $(this).attr('ows_' + _settings.ImageUrl) == 'undefined'){
                errors.push("Invalid field name for PlainDesc: " + _settings.ImageUrl);
            }
            
            if(typeof $(this).attr('ows_' + _settings.NewsDate) == 'undefined'){
                errors.push("Invalid field name for NewsDate: " + _settings.NewsDate);
            }


            if(_settings.filterBy !== '') {
                if(typeof $(this).attr('ows_' + _settings.filterBy) == 'undefined'){
                    errors.push("Invalid field name for FilterBy: " + _settings.filterBy);
                } 
            }             

            _errors = errors;

            methods.parseResponse($(this));

        });         


        if(_errors.length > 0) {
            methods.showErrors();
            return false;
        }

        methods.buildFaqs(); 
         
        $('#'+ _settings.instance+'.spBLWrapper h5 span.title').html(_settings.listName);
        //no filter 
        if(_settings.filterBy === '') { 
            $('#'+ _settings.instance+ ' #showHideFilterTrigger').hide();
            $('#'+ _settings.instance+ ' .glyphicon-filter').hide();
            $('#'+ _settings.instance+ ' .spBLFilters').hide();
        }else{
            $('#'+ _settings.instance+ ' #showHideFilterTrigger').html('Show Categories');
            $('#'+ _settings.instance+ ' #showHideFilterTrigger').attr('onclick', _settings.instance + '.showHideFilters();return false;');
        }
        //no date 
        if(_settings.showDate === false && _settings.filterBy === ''){
            $('#'+ _settings.instance+' .meta').hide();
        }

    }


    var paginate = function(clicked){

        if($(clicked).parents('li').hasClass('active') || $(clicked).parents('li').hasClass('disabled')){
            return false;
        }
        $('#'+ _settings.instance+' .pagination li').removeClass('active');

        var pos = $(clicked).attr('data-position') != '' ? $(clicked).attr('data-position') : '';

        if($(clicked).hasClass('NextButton')){
            $('#'+ _settings.instance+' a[data-position="'+pos+'"]').not('.NextButton').parents('li').addClass('active');
        }else if($(clicked).hasClass('PrevBtn')){
            $('#'+ _settings.instance+' a[data-position="'+pos+'"]').not('.PrevBtn').parents('li').addClass('active');
        }else{
            $(clicked).parents('li').addClass('active');
        }      

        
        methods.updateNextPrevBtns(pos);
        methods.clearFaqs();
        
        var options = {            
            CAMLViewFields: methods.fieldsToRead(true),
            CAMLQuery: methods.query(),
            CAMLRowLimit : _settings.rowLimit,
            CAMLQueryOptions: "<QueryOptions><Paging ListItemCollectionPositionNext='" + methods.escapeStr(pos, 'xml') + "' /></QueryOptions>"            
        } 

        var ajax = $().SPServices(methods.mergeSPCommon(options));

        $(ajax.responseXML).SPFilterNode("z:row").each(function(e) { 
            methods.parseResponse($(this));
        }); 

        methods.buildFaqs();
    }


    var filter = function(clicked){       
        _firstLoad = false;  
        _filterByValues = [];
        $('#'+ _settings.instance+'-filtersArray :checkbox:checked').each(function(e){
            _filterByValues.push($(this).val());
        })
        methods.filter();      
    }

    var clearFilter = function(){
        _firstLoad = false; 
        _filterByValues = [];

        methods.filter();

        $('#'+ _settings.instance+'-filtersArray :checkbox').each(function(e){
            $(this).prop('checked', false);
        });

    }


    
    var buildPagination = function(){ 

        if(_errors.length > 0) {
            $('#'+ _settings.instance+' .spBLPagerContainer').html('');
            console.log('Exiting buildPagination()');
            return false;
        }


        methods.getTotal(); //inside here we build filters 
        if(parseInt(_totalRecords) > parseInt(_settings.rowLimit)) { //yes paginate
            var pages = Math.ceil(_totalRecords / _settings.rowLimit);        
            var positions = Array('');

            for (var i=0; i < (pages - 1); i++) { //builds the values required 'ListItemCollectionPositionNext'
                var pos = '';
                if(i == 0){ //skips first to not pass pos
                    positions.push(methods.getNextPos(pos));
                }else{                             
                    var offset = i;
                    positions.push(methods.getNextPos(positions[offset]));                     
                } 
            }           
        // console.log(positions);
        methods.buildPagination(positions);

        }else{ // no need to paginate
            $('#'+ _settings.instance+' .spBLPagerContainer').html('');
        }  

    }   

    var showHideFilters = function(){
        var filterDiv = $('#'+ _settings.instance+ ' .spBLFilters'); 
        var trigger = $('#'+ _settings.instance+ ' #showHideFilterTrigger'); 

        if(!filterDiv.is(":visible")){
            filterDiv.slideDown('fast');
            trigger.html('Hide Categories');
        }else{
            filterDiv.slideUp('fast');
            trigger.html('Show Categories');
        }
    }

    var showHideAnswer = function(set){
        var answer = $(set + ' .answer'); 
        var question = $(set + ' .question'); 
        if(answer.is(":visible")){
            answer.slideUp('fast', function(){
                question.removeClass('minus');
            });
        }else{
            answer.slideDown('fast', function(){
                question.addClass('minus');
            });
        }
    }


    //getAllColumns for logging purposes only:

    this.getAllColumns = function (){  
         
             var colTypes = Array(
                'Text', 
                'Note', 
                'Choice', 
                'DateTime', 
                'User', 
                'TaxonomyFieldType', 
                'File', 
                'Boolean', 
                'Calculated'
                ); 
         
         
            var cols = Array();
            var ajax = $().SPServices({
                operation: "GetList",
                listName: _settings.listName,
                async : false,
                completefunc: function(xData, Status) { 

                        //obj.getListColumnsStatus = Status; 

                        if(Status == 'success'){
                            $(xData.responseXML).find("Fields > Field").each(function(x) {
                                var displayName = $(this).attr("DisplayName");
                                var internalName = $(this).attr("Name");        
                                var contentType = $(this).attr("Type");
                                // console.log($(this).context);
                                 
                                console.log('[displayName=>'+displayName+'] [internalName=>'+internalName+'] [contentType=>'+contentType+']');
                             
                             
                                if(($.inArray(contentType.trim(), colTypes) != -1)){
                                    var col = {
                                        'displayName' : displayName,
                                        'internalName' : internalName,
                                        'contentType' : contentType
                                    }
                                    cols.push(col);
                                }                   
                                 
                            });
                        }else{
                            console.log('error in getting list');
                        }
                    }
                }); 
                $.when(ajax).done(function(s){
                        console.log(cols)
                })
         
         }         
    
    //assign to "this" so accessible from outside class
    this.paginate = paginate;
    this.filter = filter;
    this.showHideFilters = showHideFilters;
    this.clearFilter = clearFilter;
    this.showHideAnswer = showHideAnswer;


    //private methods
    var methods = {         
        buildFaqs : function(){
            var output = '';
            var ImageUrl ="";
            for(var i=0; i<_faqs.length; i++){
                ImageUrl = getImageSrcValue(_faqs[i].ImageUrl);
                  if(i==0){
                    $("#firstNewsImg").attr("src",ImageUrl);
                    $("#firstNewsDate").text(getFormattedDate(_faqs[i].NewsDate));
                    $("#firstNewsTitle").text(SlicingTitle(_faqs[i].Title));
                    $("#firstNewsDesc").text(SlicingDesc(_faqs[i].PlainDesc));
                    $("#firstNewsDetailLink").attr("href","/sites/Motife/Pages/NewsDetails.aspx?ItemID="+_faqs[i].ID);
                  }
                  else{
                    output +="<div class='col-lg-4'>"+
                    "<a href='/sites/Motife/Pages/NewsDetails.aspx?ItemID="+_faqs[i].ID+"'>"+
                        "<div class='card'>"+
                            "<div class='row'>"+
                                "<div class='col-5 pr-xs-0 col-lg-12'>"+
                                    "<div class='card-img'>"+
                                    "<img src="+ImageUrl+" alt='...'>"+
                                    "<span class='card-date d-none d-lg-block'>"+getFormattedDate(_faqs[i].NewsDate)+"</span>"+
                                    "</div>"+
                                "</div>"+
                                "<div class='col-7 col-lg-12'>"+
                                    "<div class='card-body'>"+
                                        "<span class='card-date d-block d-lg-none'>"+getFormattedDate(_faqs[i].NewsDate)+"</span>"+
                                        "<h5 class='card-title'>"+SlicingTitle(_faqs[i].Title)+"</h5>"+
                                        "<p class='card-text d-none d-lg-block'>"+SlicingDesc(_faqs[i].PlainDesc)+"</p>"+
                                    "</div>"+
                                "</div>"+
                            "</div>"+
                        "</div>"+
                    "</a>"+
                "</div>";		

                  }  
                 
            }
            $('#'+ _settings.instance+' .spBLContainer').html(output);     

            
        },

        showErrors : function(){
            $('#'+ _settings.instance+' .showFilter').remove();
            $('#'+ _settings.instance+' .spBLFilters').remove();
            var html = '';
            html += '<div class="alert alert-danger">';
            html += '<ul>';
            for(var i=0; i<_errors.length; i++){
                html += '<li>'+_errors[i]+'</li>';
            }
            html += '</ul></div>';
            $('#'+ _settings.instance+' .spBLContainer').html(html);   
        },

        formatDate : function(spdate){

            spdate = spdate.replace(/[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}/, ''); //removes timestamp 00:00:00
            spdateArr = spdate.split('-');          

            var monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            var monthIndex = spdateArr[1].trim();
            var monthIndexWithoutZero = parseInt(monthIndex, 10); //removes leading zero         
            var dayF = parseInt(spdateArr[2].trim(), 10);  //removes leading zero
            var yearF = spdateArr[0].trim();
            var formattedDate =  monthNames[monthIndexWithoutZero-1] + ' ' + dayF + ', ' + yearF; 

            return formattedDate;
        },

        parseResponse : function(resp){
            var record = {}; 
            record.ID = resp.attr('ows_' + _settings.ID);
            record.Title = resp.attr('ows_' + _settings.Title);
            record.PlainDesc = resp.attr('ows_' + _settings.PlainDesc);
            record.ImageUrl = resp.attr('ows_' + _settings.ImageUrl);
            record.NewsDate = resp.attr('ows_' + _settings.NewsDate);
            record.created = resp.attr('ows_' + 'Created');

            if(_settings.filterBy !== ''){
                record.filterBy = resp.attr('ows_' + _settings.filterBy);
            }
            
            _faqs.push(record);
        },

        clearFaqs : function(){
            _faqs = Array();
            $('#'+ _settings.instance+' .spBLContainer').html('<i class="fa fa-refresh fa-spin"></i><small>Getting list items...</small>');
        },

        mergeSPCommon : function(opts){
            var common = {
                operation: 'GetListItems',
                async: false, 
                listName: _settings.listName,
                completefunc: function (xData, Status) { 
                    if(Status != 'success'){
                        _errors.push('There is an error with getting list ' + _settings.listName);
                    }          
                }
            }//end common
            for(var key in common){
                opts[key] = common[key];
            }
            return opts;
        },

        fieldsToRead : function(fetchAllCols){
            var fieldsToRead = "<ViewFields>";

            if(fetchAllCols == true){
                fieldsToRead += "<FieldRef Name='" + _settings.ID +"' />";
                fieldsToRead += "<FieldRef Name='"+ _settings.Title +"'/>";      
                fieldsToRead += "<FieldRef Name='" + _settings.PlainDesc +"' />";
                fieldsToRead += "<FieldRef Name='" + _settings.ImageUrl +"' />";
                fieldsToRead += "<FieldRef Name='"+ _settings.NewsDate +"'/>";     
            }
                                                  
            fieldsToRead += "<FieldRef Name='Created'/>"; 
                        
            if(_settings.filterBy != '' || typeof _settings.filterBy != 'undefined') {
                fieldsToRead += "<FieldRef Name='"+_settings.filterBy+"'/>"; 
            }

            fieldsToRead += "</ViewFields>";
            return fieldsToRead;
        },

        query : function(){

            var filterByClause = "<Neq><FieldRef Name='ID'/><Value Type='Number'>0</Value></Neq>"; //this is to fetch all
             
            if(_filterByValues.length > 0){

                filterByClause = '';

                if(_filterByValues.length == 1){ //only 1 filter
                    for(var i = 0; i < _filterByValues.length; i++){
                            filterByClause += '<Eq><FieldRef Name="'+ _settings.filterBy +'" />'; 
                            filterByClause += '<Value Type="Text">'+methods.escapeStr(_filterByValues[i], 'html')+'</Value></Eq>';
                    }
                }else if(_filterByValues.length > 1 && _filterByValues.length < 2) { //2 filters
                    filterByClause += '<Or>';   
                        for(var i = 0; i < _filterByValues.length; i++){
                            filterByClause += '<Eq><FieldRef Name="'+ _settings.filterBy +'" />'; 
                            filterByClause += '<Value Type="Text">'+methods.escapeStr(_filterByValues[i], 'html')+'</Value></Eq>';
                        }
                    filterByClause += '</Or>';   
                }else{ //more than 3 filters                      
                        for(var i = 0; i < (_filterByValues.length - 1); i++){
                            filterByClause += '<Or>'; 
                        }
                        for(var i = 0; i < 2; i++){
                            filterByClause += '<Eq><FieldRef Name="'+ _settings.filterBy +'" />'; 
                            filterByClause += '<Value Type="Text">'+methods.escapeStr(_filterByValues[i], 'html')+'</Value></Eq>';
                        }                        
                        filterByClause += '</Or>';  
                        for(var i = 2; i < _filterByValues.length; i++){
                            filterByClause += '<Eq><FieldRef Name="'+ _settings.filterBy +'" />'; 
                            filterByClause += '<Value Type="Text">'+methods.escapeStr(_filterByValues[i], 'html')+'</Value></Eq>';
                            filterByClause += '</Or>'; 
                        }   
                } 
                  
            }

            var query = "<Query>" +
                                "<Where>" + filterByClause + "</Where>" +
                                "<OrderBy>" + 
                                    "<FieldRef Name='Created' Ascending='FALSE'/>" +
                                "</OrderBy>" +
                            "</Query>"; 
            return query;
        },

        escapeStr : function (str, strType) { 
            if ( typeof str !== "string" ) { 
                return ""; 
            } 

            if(strType == 'xml'){
                return str
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/'/g,"&apos;")
                .replace(/"/g,"&quot;"); 
            }

            if(strType == 'html'){
                 return str
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            }

            else return;

        }, 

        getTotal : function(){
            var ajaxCall = methods.callSPServices('nolimit',false);                
            $.when(ajaxCall).done(function(){
                //only build filters on first load!!!                
                if(_firstLoad == true && _settings.filterBy !== ''){
                    methods.getFilterByValues(ajaxCall);
                    methods.buildFilters();
                }
                _totalRecords = ($(ajaxCall.responseXML).SPFilterNode("rs:data").attr("ItemCount"));
            });      

        },

        getFilterByValues : function(resp){
            
            var filterList = Array();
            var filterListUnique = Array();

            $(resp.responseXML).SPFilterNode("z:row").each(function(e) { 
                var filterValue = $(this).attr('ows_' + _settings.filterBy); 
                    if(typeof filterValue !== 'undefined'){ //only add to array if theres a value
                        filterList.push(filterValue);
                    }
            });


            $.each(filterList,function(i,el){ //get rid of duplicates
                if($.inArray(el, filterListUnique) === -1){
                    filterListUnique.push(el);
                }
            });

            _filterByListUnique = filterListUnique;
            _filterByList = filterList; 

        },

        filter : function(){


            $('#'+ _settings.instance+'-filtersArray input').attr('disabled', 'disabled');
            $('#'+ _settings.instance+' .clearFilter').attr('disabled', 'disabled');

            methods.clearFaqs();
            var ajax = methods.callSPServices(_settings.rowLimit, true);

            $(ajax.responseXML).SPFilterNode("z:row").each(function(e) { 
                methods.parseResponse($(this));
            });

            setTimeout(function(){
                methods.buildFaqs();
                buildPagination();
                $('#'+ _settings.instance+'-filtersArray input').removeAttr('disabled');
                $('#'+ _settings.instance+' .clearFilter').removeAttr('disabled');
            },10);


            if(_filterByValues.length > 0){
                $('#'+ _settings.instance + ' .clearFilter').show();
            }else{
                $('#'+ _settings.instance + ' .clearFilter').hide();
            }

        },


        buildFilters : function(){ 

            var count = 0;
            var out = '';         
            out += '<fieldset id="'+_settings.instance+'-filtersArray">';   
            for(var i = 0; i < _filterByListUnique.length; i++){
                var val = _filterByListUnique[i]; 
                //get count of each filter
                $.each(_filterByList, function(n){
                    if(val == _filterByList[n]){
                        count++;
                    }
                }); 
                out += '<div class="checkbox checkbox-success col-lg-3 col-md-5 col-sm-11 col-xs-11">';
                out += '<input name="'+_settings.instance+'-chk[]" id="'+_settings.instance+'-chk-'+i+'" onclick="'+_settings.instance + '.filter()" type="checkbox" value="'+ val+'">';
                out += '<label for="'+_settings.instance+'-chk-'+i+'">'+ methods.cleanUp(val) + ' <span class="count">(' + count + ')</span>' +'</label>';    
                out += '</div>';  
                count = 0;           
            }
            out += '</fieldset>';
            out += '<button class="btn btn-sm btn-default clearFilter" onclick="'+_settings.instance+'.clearFilter(); return false;">clear</button>'; 
            $('#'+ _settings.instance+' .spBLFilters').html(out);
        
        },

        cleanUp : function(str){
            if(typeof str === 'string'){
                var cleanStr = '';
                cleanStr = str.replace(/^\./g, ''); //removes leading dot
                cleanStr = cleanStr.replace(/\u200B/g,''); //removes non breaking space
                return cleanStr.trim();
            }else{
                return str;
            }
        },

        callSPServices  : function(rowLimit, fetchAllCols){
            var limit = (rowLimit == 'nolimit') ? '1000000' : _settings.rowLimit;
            var options = {
                CAMLViewFields: methods.fieldsToRead(fetchAllCols),
                CAMLQuery: methods.query(),
                CAMLRowLimit : limit
            } 
            var response = $().SPServices(methods.mergeSPCommon(options));
            return response;
        },

        getNextPos : function(pos){
            var limit = _settings.rowLimit; 
            var options = {
                CAMLViewFields: methods.fieldsToRead(false),
                CAMLQueryOptions: "<QueryOptions><Paging ListItemCollectionPositionNext='" + methods.escapeStr(pos, 'xml') + "' /></QueryOptions>",
                CAMLQuery: methods.query(),
                CAMLRowLimit : limit
            }
            var ajax = $().SPServices(methods.mergeSPCommon(options));            
            return $(ajax.responseXML).SPFilterNode("rs:data").attr('ListItemCollectionPositionNext');
        },

        buildPagination : function(items){
            if(_firstLoad == false){
                $('#'+ _settings.instance+' .spBLPagerContainer').html(pager);
            }            
            _positions = items;
            var pager = '<ul class="pagination  pagination-sm">';

            //previous button
            pager +=  '<li class="disabled"><a href="#" class="PrevBtn" data-position="" '; 
            pager += 'onclick="'+_settings.instance+'.paginate(this);return false;" aria-label="Next">';
            pager += '<span aria-hidden="true">&laquo;</span></a></li>';


            for(var x=0; x<items.length; x++){
                if(typeof items[x] != 'undefined'){                         
                    var pageNumber = (x+1);   
                    var activeClass = pageNumber == 1 ? 'active' : '';     
                    pager += '<li class="'+ activeClass +'""><a href="#" onclick="'+_settings.instance+'.paginate(this);return false;" data-position="'+items[x]+'">'+pageNumber;
                    pager += '</a></li>';
                }
            }

            // next button
            var nextPosition = _positions[1]; //first load - hard coded position of next
            pager += '<li><a href="#" class="NextButton" onclick="'+_settings.instance+'.paginate(this);return false;" data-position="'+nextPosition+'" aria-label="Next">'; 
            pager += '<span aria-hidden="true">&raquo;</span></a></li>';
            pager += '</ul>';
             
            $('#'+ _settings.instance+' .spBLPagerContainer').html(pager);            
            
        }, 

        updateNextPrevBtns : function(pos){

            for(var i=0; i<_positions.length; i++){
                if(pos == _positions[i]){

                    var offsetForNext = i+1;
                    
                    if(typeof _positions[offsetForNext] != 'undefined'){
                        $('#'+ _settings.instance+' a.NextButton').parents('li').removeClass('disabled');
                        $('#'+ _settings.instance+' a.NextButton').attr('data-position', _positions[offsetForNext]);
                    }else{
                        $('#'+ _settings.instance+' a.NextButton').parents('li').addClass('disabled');
                    }

                    var offsetForPrev = i-1;
                    
                    if(typeof _positions[offsetForPrev] != 'undefined'){
                        $('#'+ _settings.instance+' a.PrevBtn').parents('li').removeClass('disabled');
                        $('#'+ _settings.instance+' a.PrevBtn').attr('data-position', _positions[offsetForPrev]);
                    }else{
                        $('#'+ _settings.instance+' a.PrevBtn').parents('li').addClass('disabled');
                    }


                }
            }
        }
    }; // end methods

    $(document).ready(function(){   
        document.title = "News";
        _siteUrl = _spPageContextInfo.webAbsoluteUrl;
        init();
        setInterval(function () {
            UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
        }, 20 * 60000);
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', newsStart);
    }); 
    function newsStart(){
     
        var urlForNewsList = _siteUrl + "/_api/web/lists/GetByTitle('News')";
        var get_NewsList = SPRestCommon.GetItemAjaxCall(urlForNewsList);
        $.when(get_NewsList)
        .then(function (respNewsList) {
            _newsListDetails = respNewsList.d;
            $("#contentListTitle").text(_newsListDetails.Title);
            $("#contentListDesc").text(_newsListDetails.Description);
        }).fail(CommonUtil.OnRESTError);

      
    }    
    $(window).load(function(){
        buildPagination();  
    });    

};