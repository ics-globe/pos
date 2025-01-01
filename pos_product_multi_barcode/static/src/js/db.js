/** @odoo-module **/
import { PosDB } from "@point_of_sale/app/store/db";
import { patch } from "@web/core/utils/patch";
import { unaccent } from "@web/core/utils/strings";


patch(PosDB.prototype, {
  _product_search_string(product) {
    var str = product.display_name;
    if (product.barcodes_json) {
          const barcodes = JSON.parse(product.barcodes_json)
          
          if (barcodes.length >0){
          for(let barcode of barcodes){
            str += str.replace("\n", "|" + barcode) + "\n";
            
          }
        }
      
          }
    if (product.barcode) {
        str += "|" + product.barcode;
    }
    if (product.default_code) {
        str += "|" + product.default_code;
    }
    if (product.description) {
        str += "|" + product.description;
    }
    if (product.description_sale) {
        str += "|" + product.description_sale;
    }
    str = product.id + ":" + str.replace(/[\n:]/g, "") + "\n";
    // console.log('product',str)
    return str;
},

add_products(products) {
  var obj = this
  var stored_categories = this.product_by_category_id;


  if (!(products instanceof Array)) {
      products = [products];
  }
  for (var i = 0, len = products.length; i < len; i++) {
      var product = products[i];
      if (product.id in this.product_by_id) {
          continue;
      }
      if (product.available_in_pos) {
          var search_string = unaccent(this._product_search_string(product));
          const all_categ_ids = product.pos_categ_ids.length
              ? product.pos_categ_ids
              : [this.root_category_id];
          product.product_tmpl_id = product.product_tmpl_id[0];
          for (const categ_id of all_categ_ids) {
              if (!stored_categories[categ_id]) {
                  stored_categories[categ_id] = [];
              }
              stored_categories[categ_id].push(product.id);

              if (this.category_search_string[categ_id] === undefined) {
                  this.category_search_string[categ_id] = "";
              }
              this.category_search_string[categ_id] += search_string;

              var ancestors = this.get_category_ancestors_ids(categ_id) || [];

              for (var j = 0, jlen = ancestors.length; j < jlen; j++) {
                  var ancestor = ancestors[j];
                  if (!stored_categories[ancestor]) {
                      stored_categories[ancestor] = [];
                  }
                  stored_categories[ancestor].push(product.id);

                  if (this.category_search_string[ancestor] === undefined) {
                      this.category_search_string[ancestor] = "";
                  }
                  this.category_search_string[ancestor] += search_string;
              }
          }
      }
      this.product_by_id[product.id] = product;
      if (product.barcode && product.active && product.barcodes_json) {
        products.forEach(function (product) {
                          var barcodes = JSON.parse(product.barcodes_json);
                          // const product_by_barcode = {}
                          barcodes.forEach(function (barcode) {
                              obj.product_by_barcode[barcode] = product;
                          });
                      });
                      // console.log('barcode',product_by_barcode)
      }
      if (this.product_by_tmpl_id[product.product_tmpl_id]) {
          this.product_by_tmpl_id[product.product_tmpl_id].push(product);
      } else {
          this.product_by_tmpl_id[product.product_tmpl_id] = [product];
      }
  }
}
  
    
});

