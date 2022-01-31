$(function(){
    let localStorage = window.localStorage;

    let gameDataCache = {};

    function getGameData(game_row_elem){
        return new Promise(function(resolve){
            let data = {};
            data.title = game_row_elem.find(".game_link").text();
            data.id = game_row_elem.find(".game_links").find("a").first().attr("href").split("/").pop();
            resolve(data);
        });
        
    }

    function saveLocalStorage(){
        let data = {
            "ih_text_filter":searchinput.val(),
            "filter":filter,
            "ih_gameDataCache":gameDataCache,
            "ih_sorting":sorting
        };
        data.ih_filter = filter;
        chrome.storage.local.set(data);
    }
    function loadLocalStorage(){
        let txt = localStorage.getItem("ih_text_filter") ?? "";
        chrome.storage.local.get(["ih_text_filter", "filter", "ih_gameDataCache", "ih_sorting"], function(result){
            if(result.filter != null){
                for(let f in result.filter){
                    filter[f] = result.filter[f];
                }
            }
            if(result.ih_gameDataCache != null){
                gameDataCache = result.ih_gameDataCache;
            }
            if(result.ih_sorting != null){
                sorting = result.ih_sorting;
            }

            refreshDashboard({instant:true});
        });
        return;
        
    }

    const filter_btns = {
        published: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble green"><a href="#">Published</a></span></div>`),
        draft: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble red"><a href="#">Draft</a></span></div>`),
        restricted: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble purple"><a href="#">Restricted</a></span></div>`),
        mine: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble ih_lightgrey"><a href="#">Mine</a></span></div>`),
        others: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble ih_darkgrey"><a href="#">Collab</a></span></div>`)
    }

    let filter_buttons = $(`<div class="ih_filters"><span style="opacity: 0.5;">Filter:</span></div>`);
    let filter = {
    };
    for(let f in filter_btns){
        filter[f] = true;
        // if(f == "mine"){
        //     filter_buttons.append("<span>&nbsp;&nbsp;&nbsp;  &nbsp;</span>");
        // }
        filter_buttons.append(filter_btns[f]);
        let ff = f;
        filter_btns[f].on("click", function(event){
            event.preventDefault();
            filter[ff] = !filter[ff];
            refreshDashboard();
        });
    }

    let arrow_down = "▼";
    let arrow_up = "▲";
    let sort_buttons = $(`<div class="ih_sort"><span style="opacity: 0.5;">Sort:</span></div>`);
    let sort_elems = {
        "alpha": $(`<div class="publish_status ih_sort_btn"><span class="tag_bubble ih_lightgrey"><a href="#">Alphabetical</a><span class="arrow"></span></span></div>`),
        "created": $(`<div class="publish_status ih_sort_btn"><span class="tag_bubble ih_lightgrey"><a href="#">Date Created</a><span class="arrow"></span></span></div>`)
    }
    let sorting = {
        "type":"alpha",
        "descending":true
    };
    for(let s in sort_elems){
        sort_buttons.append(sort_elems[s]);
        sort_elems[s].on("click", function(event){
            event.preventDefault();
            if(sorting.type == s){
                sorting.descending = !sorting.descending;
            }
            else{
                sorting.type = s;
            }
            refreshDashboard();
        });
    }

    function refreshDashboard(options={}){
        saveLocalStorage();
        let val = searchinput.val();
        val = val.replaceAll(" ","");
        val = val.toLowerCase();

        let games = [];

        function sortGames(){
            
            games.sort(function(game_a, game_b){
                let n = 0;
                switch(sorting.type){
                    case "created":
                        n = game_b.data.id - game_a.data.id;
                        break;
                    case "alpha":
                    default:
                        n = game_a.data.original_index - game_b.data.original_index;
                        break;
                }
                if(!sorting.descending){
                    n = -n;
                }
                return n;
            });
            let gamelist = $(".game_list");
            for(let i = games.length-1; i >= 0; i--){
                gamelist.prepend(games[i].elem);
            }
        }

        let gamerows = $(".game_row");

        gamerows.each(async function(index, elem){
            let game = $(elem);
            let title = game.find(".game_link");

            let url = title.attr("href");

            let data = await getGameData(game);
            if($(elem).attr("ih_ind")){
                data.original_index = parseInt($(elem).attr("ih_ind"));
            }
            else{
                $(elem).attr("ih_ind", index);
                data.original_index = index;
            }
            let gdata = {
                "elem":game,
                "data":data
            }
            games.push(gdata);
            if(games.length == gamerows.length){
                sortGames();
            }
            
            let text = title.text();
            text = text.replaceAll(" ", "");
            text = text.toLowerCase();
            let show = val == "" || text.includes(val);
            let owner = $(elem).find(".owner");
            if(show){
                let txt = game.find(".publish_status").find("a").text().toLowerCase();
                if(!filter.published && txt.includes("published")) show = false;
                else if(!filter.restricted && txt.includes("restricted")) show = false;
                else if(!filter.draft && txt.includes("draft")) show = false;
                else if(!filter.mine && owner.length == 0) show =false;
                else if(!filter.others && owner.length > 0) show = false;
            }

            let time = 200;
            if(options.instant) time = 0;
            if(show){
                if(!game.is(":visible")){
                    game.show(time);
                }
                else{
                    game.show();
                }
            }
            else{
                if(game.is(":visible")){
                    game.hide(time);
                }
                else{
                    game.hide();
                }
            }
        });

        for(let f in filter_btns){
            if(filter[f]) filter_btns[f].css("opacity", 1);
            else filter_btns[f].css("opacity", 0.55);
        }

        for(let s in sort_elems){
            if(sorting.type == s){
                if(sorting.descending){
                    sort_elems[s].find(".arrow").text(arrow_down);
                }
                else{
                    sort_elems[s].find(".arrow").text(arrow_up);
                }
                sort_elems[s].css("opacity",1);
            }
            else{
                sort_elems[s].find(".arrow").text("");
                sort_elems[s].css("opacity", 0.7);
            }
        }
        
    }


    let search = $(`<div class="ih_dash_search"></div>`);
    let searchinput = $(`<input type="text" class="ih_dash_search_input search_input"></input>`);
    let searchsvg = $(`<svg width="30px" stroke-linecap="round" stroke="currentColor" class="svgicon icon_search" role="img" version="1.1" viewBox="0 0 24 24" stroke-width="3" height="18" stroke-linejoin="round" aria-hidden="" fill="none" width="18"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`);
    search.append(searchsvg);
    search.append(searchinput);
    
    let leftCol = $(`.left_col`);
    if(leftCol.length){
        leftCol = leftCol.first();
        leftCol.prepend(sort_buttons);
        leftCol.prepend(filter_buttons);
        leftCol.prepend(search);
        setTimeout(function(){
            leftCol.fadeTo(300, 1);
        }, 50)
        
        searchinput.on("input", function(){
            refreshDashboard();
        });
    }
    loadLocalStorage();
});
