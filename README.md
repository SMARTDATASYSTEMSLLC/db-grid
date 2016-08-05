db-grid
====================

Lightweight Angular Grid Control

To Install this package:

    bower install db-grid --save


Example Usage:

```html
<db-grid for="cat in vm.cats" label="cats">
 <a href="#/create-cat" class="btn btn-default"><i class="fa fa-plus"></i> Add Cat</a>
   
 <db-col key="catName" label="Name" bind="true">
   <div ng-if="vm.canViewCatDetails">
     <a href="#/cat-details/{{cat.catId}}/" class="cat-link"><b>{{cat.catName}}</b></a>
   </div>
   <div ng-if="!vm.canViewCatDetails">
     <b ng-if="!vm.canViewCatDetails">{{cat.catName}}</b>
   </div>
 </db-col>
    
 <db-col key="age" type="number"></db-col>
    
 <db-col key="birthday" type="date">{{cat.birthday | date: 'M/d/yyyy'}}</db-col>
    
</db-grid>
```

db-grid options
-------------------

for="item in cats"
for="item" // if using a server side api

label="cats"  // label to use in pagination and filters

table-class="table-condensed" //A css class to add to the table

filter="none"  // customize the filter availability. One of the options 'none', 'simple' or 'advanced'. Defaults to 'advanced'. Bound once.

pageSize="25"  //The page size, defaults to 25. Bound once.

db-col options
-------------------

key="item.catName" The key to base sorting and filtering on.

label="Cat Name" // A custom label. Defaults to key.

title="Title tooltip"

width="500px"

col-class="column-class"

query="default filter"

type="date" // 'string', 'number', 'date', or 'bool'. Used for filtering and sorting. Defaults to 'string'.

canSort="false" // Whether or not the column is sortable. Defaults to true.

bind="true" // Whether to use full binding on the column. True will use full binding, false will use once-bound interpolate templates. Defaults to false.
