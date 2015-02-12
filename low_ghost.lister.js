var Lister = (function (options, listKeys, sortKeys, customKeyData) {
//============================instructions===================================================//
/*   in js file, add an options variable with an array formatted similarly to
   settings array bellow. If the default is acceptable, simply don't include it. Example:

   var options = {   itemsPerPage : 4,
                     searchInput : "#search",
                     paginationElement : "#page-box",
                     autoSort : "asc",
                     autoSortKey : ".title"
                  };
   var listKeys = [".title", ".author", ".description"], // list keys and sortKeys match 1:1, so if
       sortKeys = ["none", "#sort-author-button"];          a key should not be sortable, include
                                                            a string signifing this (not empty!) or
                                                            ignore end values

   var list = new Lister(options, listKeys, sortKeys);
                                                                                             */
//===========================end instructions================================================//

//===========================defaults========================================================//
//  give full selector as a string e.g. "#list", ".key1," "li"
    var settings = {
        listID : "#list",
        liEquiv : "li",  //top level of the individual list objects, can be anything
        searchInput : "#search",
        autoSort : "", //Leave blank if not choosen, otherwise "asc" or "desc"
        autoSortKey : "", //Leave blank or choose same selector string as listKeys1 or listKeys2
                          //ex. ".key1"
        //pagination
        itemsPerPage : 0, //Leave at this inoridinately high number if no pagination needed
        paginationElement : "#pagination", //replace to choose existing element or name of element
                                           //to be appended. Use only ID as selector ex. "#page-numbers"
        paginationLeft : 3,
        paginationInner : 3, //gives more numbers after active page if an even number
        paginationRight : 3,
        stringBeforeNum : "" //include whitespace if needed
    };
    if (!listKeys){
        var listKeys = [".key1", ".key2"];
    }
    if (!sortKeys){
        var sortKeys = ["#sKey1", "#sKey2"];
    }
//==========================end defaults=====================================================//
//===================change out defaults for user options====================================//
    for (var prop in options) {
        if (options.hasOwnProperty(prop)){
            settings[prop] = options[prop];
        }
    }
//==============================establish initial values=====================================//

    var //establish global variables
        $sortKeys = [],
        elementsTotal, searchResults, isPaginated, updatedTextFields,
        $listID, $elements, $elementsReset, $cache = [],
        pageLoads = 1;
    //format list, called on any change
    function formatList(arr, start, end){
        var i = start;
        $elements.css({'display':'none'});
        for ( ; i < end; i++) {
            $(arr[i]).css({'display':'block'});
        }
    }
    function generalReformat(newPage){
        var index = isPaginated && pagination.getIndex(newPage) || [0, $elements.length];
        formatList(searchResults, index[0], index[1]);
        if (isPaginated){
            pagination.changePage(newPage);
        }
    }
//======================================pagination===========================================//
    var pagination = {
        init : function (elementsTotal){ //create page numbers
            var pageHTML = [];
            this.pages = Math.ceil(elementsTotal.length / settings.itemsPerPage);
            for (var i = 1; i <= this.pages; i++) {
                pageHTML.push('<span data-page="' + i + '" class="nums page-' + i + '"><a href="#">' + settings.stringBeforeNum + i + '</a></span>');
            }
            $(settings.paginationElement).length || $listID.after("<div id='" + settings.paginationElement.slice(1) + "'></div>");
            $(settings.paginationElement).html(pageHTML.join(''));
            this.element = $(settings.paginationElement);
            this.nums = this.element.find(".nums");
        },
        format: function (active){
            //establish all page related values
            var ipp = settings.itemsPerPage,
                pl =  +settings.paginationLeft,
                pi = +settings.paginationInner,
                pr = settings.paginationRight,
                newTotal = Math.ceil(searchResults.length / ipp),
                endInner =  active  + 1 + (Math.floor(pi / 2)),
                initInner = endInner - pi,
                initRight = newTotal - pr,
                leftNums = (initInner <= pl) && this.nums.slice(0, (pl + pi))
                    || this.nums.slice(0, pl), //set left # normally or in an end configuration
                innerNums = this.nums.slice(initInner, endInner),
                rightNums = (endInner >= newTotal - pr) && this.nums.slice(newTotal - (pr + pi), newTotal)
                    || this.nums.slice(initRight, newTotal), //set right # normally or in an end configuration
                cssHide = {'display':'none'},
                cssShow = {'display':'inline-block'},
                $ellipsis = $("<span class='ellipsis'>...</span>");
            //clear pagination
            this.nums.css(cssHide);
            $('.ellipsis').remove();
            //conditions to show various segments of the pagination array
            if (newTotal > (pl + pi + pr)) {
                $(leftNums).css(cssShow);
                if ((initInner > pi - (pi - 1)) && (initInner > pl)){
                    this.nums.slice(pl - 1, pl).after($ellipsis.clone());
                }
                if(endInner < initRight){
                    $(innerNums).css(cssShow);
                }
                $(rightNums).css(cssShow);
                if (endInner < initRight){
                    $(rightNums).first().before($ellipsis.clone());
                }
            } else if (newTotal > 1){
                this.nums.slice(0, newTotal).css(cssShow);
            }
        },
        getCurrent : function(){
            var current = this.element.data("currentPage");
            return current;
        },
        getIndex : function(page){
            var index1 = settings.itemsPerPage * (page - 1),
                index2 = (this.pages>1) && settings.itemsPerPage * page || $elements.length;
            return [index1, index2];
        },
        changePage : function(newPage) {
            //change class of active element
            this.nums.removeClass("active");
            this.nums.slice((+newPage - 1), newPage).addClass("active");
            //format pagination
            this.format(newPage - 1);
            this.element.data("currentPage", newPage);
        },
        eventListeners : function(){
            this.nums.click(
                function(){
                    var newPage = $(this).data("page");
                    generalReformat(newPage);
                }
            );
        }
    };
//===================================end pagination=========================================//
//========================================search============================================//
//search funtion which updates the array of elements (searchResults), in turn used by all other functions
    /* at some point, build immutable data like so:
    var data = [
      {
        title: "Jamestown",
        description: "has a population of 2047",
        tags: ["james", "town"],
        dom : $elements[0]
      },
      {
        title: "Jamestown 2.0",
        description: "has a population of 2048",
        tags: ["james", "town", "2.0"],
        dom : $elements[1]
      }
  ];
  that'll get rid of the need to continuously track listKeys, searchResults, $elements, $elementsReset
  and make the search -- if updatedFields (just listKeys matches) contains query, updatedFields.dom.show()
  and can create new instance of updatedFields directly. Should also link listKeys if match extra object keys
  from customKeyData, ie make tags a listKey if it is searchable*/
    var data = {
        listKeys : [], textFields : [], customTextFields : [],

        fromDOM : function(){  //get searchable text fields
            var listKeyLength = listKeys.length,
                elementsLength = $elements.length;
            for (var i = 0; i < listKeyLength; i++){
                this.textFields[i] = [];
                if ($(listKeys[i]).length){
                    this.listKeys[i] = $(listKeys[i]);
                } else {
                    this.listKeys[i] = listKeys[i];
                }
                for (var j = 0; j < elementsLength; j++){
                    if (this.listKeys[i] instanceof jQuery){
                        this.textFields[i][j] = $elements.eq(j).find(this.listKeys[i]).text().toLowerCase();
                    }
                }
            }
        },
        fromData : function(){
            if(customKeyData){
                console.log("lister recieved custom data");
                low_ghost.whereAdd(this.textFields, customKeyData, listKeys);
            } else {
                console.log("lister recieved no custom data");
            }
        },
        build : function(){
            this.fromDOM();
            this.fromData();
        }
    };
    var search = {
        main : function(searchQuery){
            searchResults = low_ghost.search(searchQuery, updatedTextFields, elementsTotal);
            this.reformat();
        },
        reformat : function (){  //sort and pagination connector
            var current, newPages, lastKnownPage;
            //determine sorting if necessary
            for (var i = 0; i < $sortKeys.length; i++){
                var order = $(sortKeys[i]).data("ord");
                if (order){
                    var key = $(sortKeys[i]).data("sortKey");
                }
            }
            if (key && order){
                sort.main(key, order); //call sort function
            }
            if (settings.autoSort.length && !order){
                sort.main(settings.autoSortKey, settings.autoSort);
            }
            //determine new pagination and re-route if page no longer exists
            if (isPaginated){
                current = pagination.getCurrent();
                newPages = Math.ceil(searchResults.length / settings.itemsPerPage);
                if (current===0){
                    newPages = lastKnownPage || 1; //condition if returning from empty search result
                } else if (current > newPages){
                    lastKnownPage = current;
                } else {
                    newPages = current;
                }
            } else {
                newPages = 1;
            }
            generalReformat(newPages);
        },
        eventListeners: function (){
            //this mess handles a custom search box, it's input, and their order as arguments
            var input, searchTerms, searchQuery;
            if (arguments[0] instanceof jQuery){
                input = arguments[0];
            } else {
                searchTerms = arguments[0];
            }
            if (arguments[1] instanceof jQuery){
                input = arguments[1];
            } else if (arguments[1]){
                searchTerms = arguments[1];
            }
            if (searchTerms) {
                searchQuery = searchTerms.toLowerCase();
                search.main(searchQuery);
            } else if (input){  //event listener at inputs
                input.keyup(
                    function () {
                        searchQuery = input.val().toLowerCase();
                        search.main(searchQuery);
                    }
                );
            }
        }
    };
//=====================================end search============================================//
//============================================sort===========================================//
    var sort = {
        init : function(){
            for (var i = 0; i < listKeys.length; i++){
                $(sortKeys[i]).data("sortKey", listKeys[i]);
            }
            $sortKeys = $(sortKeys.join(", "));
        },
        main : function(key, ord) {
            searchResults = low_ghost.advSort(searchResults, key, ord);
            $listID.append(searchResults);
        },
        eventListenersFunction :  function (key, order){
            var self = $(this);
            current = isPaginated && pagination.getCurrent() || 1;
            //change class of buttons
            if (self.hasClass("asc")){
                self.data("ord", "desc").removeClass("asc").addClass("desc");
            } else if (self.hasClass("desc")){
                self.data("ord", "asc").removeClass("desc").addClass("asc");
            } else {
                self.data("ord", "asc").addClass("asc");
            }
            $sortKeys.not(self).data("ord", "").removeClass("asc, desc");
            //call sort function
            if (self.data("sortKey")){
                sort.main(self.data("sortKey"), self.data("ord"));
            } else {
                sort.main(key, order);
            }
            if (pageLoads !== 1){
                generalReformat(current);
            }
        },
        eventListeners : function(){
            $sortKeys.on("click", sort.eventListenersFunction); //add funtion call to sort buttons
        }
    };
//========================================end sort===========================================//
//========================================initialize=========================================//
    var init = {
        variables : function(){
            this.totals();
            $listID = $(settings.listID);

            $elementsReset = $elements;
            isPaginated = (settings.itemsPerPage !== 0) && true || false; //globally establish if pagination is required
        },
        totals : function(){
            //copy elements to initial search results (the same, as the search box is empty until keyup)
            searchResults = elementsTotal.slice();
            $elements = $(elementsTotal);
        },
        eventListeners: function(noNewElements){
            if (isPaginated){
                pagination.eventListeners();
            }
            if (settings.searchInput){
                search.eventListeners($(settings.searchInput));
            }
            sort.eventListeners(); //if initial page load, initialize event listeners
        },
        view : function(){
            if (settings.autoSort.length){
                sort.main(settings.autoSortKey, settings.autoSort);
            }
            if (settings.searchInput && $(settings.searchInput).val()){
                search.eventListeners($(settings.searchInput), $(settings.searchInput).val().toLowerCase());
            }
            //initialize page as initial view
            generalReformat(1);
            pageLoads++;
        },
        init : function(newElementsTotal){
            elementsTotal = !low_ghost.is(newElementsTotal)
                && $(settings.listID).find($(settings.liEquiv))
                || newElementsTotal;
            if (pageLoads === 1){
                this.variables(elementsTotal);
                data.build(); // get data from DOM and data object
                updatedTextFields = data.textFields;
                sort.init();
                if (isPaginated){
                    pagination.init(elementsTotal); // initialize pagination
                }
                this.eventListeners();
            } else {
                this.totals();
            }
            this.view(); // initialize the view
        }
    }
    init.init();


//======================================end initialize=======================================//
//=====================================return API============================================//
    var cache = new Array ([]),
        cacheEntries = 0;
    var API = {
        returnFields : function(reformat, newElementsTotal){
            var primary = low_ghost.getPrimary(customKeyData, "title"),
                fields = [],
                elLength = $elementsReset.length;
            for (var i = 0; i < updatedTextFields.length; i++) {
                fields[i] = [];
            }
            for (var i = 0; i < elLength; i++){
                if(low_ghost.is(newElementsTotal[i])){
                    var individualKey = $(newElementsTotal[i]).find(".title").text().toLowerCase();
                    var indexOfTitle = +updatedTextFields[primary.pIndex].indexOf(individualKey);
                    for (var j = 0; j < updatedTextFields.length; j++) {
                        if (indexOfTitle > -1){
                            fields[j][i] = updatedTextFields[j][indexOfTitle];
                        }
                    }
                }
            }
            if(low_ghost.is(reformat)){
                reformat(newElementsTotal, fields);
            }
            return fields;
        }
    };
    return { customSort : sort.eventListenersFunction,
             changePage : pagination.changePage,
             customSearch : search.eventListeners,
             resetList : function resetList(newOptions){
                            for (var prop in newOptions) {
                                if (newOptions.hasOwnProperty(prop)){
                                    settings[prop] = newOptions[prop];
                                }
                                pagination.changePage(1);
                            }
                        },
            customFilter: function filterInit(query, reformat){ //takes an array of search terms
                                                      //give empty query or list.customFilter() to reset
                            var matching = false,
                                newElementsTotal = $elements.slice(),
                                reformatIsTruthy = low_ghost.is(reformat),
                                fn = low_ghost.is(reformat) && reformat || null;
                            if (low_ghost.is(query) && query.length > 0){
                                //checks the cache for query
                                for (var i = 0; i < cacheEntries; i++){
                                    if (cache[i] && low_ghost.nonRecursiveMatch(cache[i][0], query)){
                                        searchResults = cache[i][1];
                                        search.reformat();
                                        init.init(cache[i][1]);
                                        if (fn){
                                            reformat(newElementsTotal, cache[i][2]);
                                        }
                                        matching = true;
                                        console.log("cache fired");
                                        break;
                                    }
                                }
                                if (!matching){
                                    var i = query.length;
                                    while (i--){
                                        newElementsTotal = low_ghost.search(query[i], updatedTextFields[2], newElementsTotal);
                                        updatedTextFields = API.returnFields(null, newElementsTotal);
                                    }
                                    cache[cacheEntries] = [];
                                    cache[cacheEntries][0] = query.slice();
                                    cache[cacheEntries][1] = newElementsTotal.slice();
                                    cache[cacheEntries][2] = updatedTextFields.slice();
                                    searchResults = newElementsTotal;
                                    search.reformat();
                                    updatedTextFields = API.returnFields(fn, searchResults);
                                    init.init(newElementsTotal);
                                    cacheEntries++;
                                }
                            } else {
                                updatedTextFields = data.textFields;
                                search.reformat();
                                init.init($elementsReset);
                                reformat($elementsReset, updatedTextFields);
                            }

                        },
            init : init.init
    };
});
//===================================end return API==========================================//
//=====================================end lister============================================//
