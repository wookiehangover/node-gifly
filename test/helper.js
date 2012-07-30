exports.expect = function( assertions, cb ){
  var count = 0;
  return function(){
    count += 1;
    if( count === assertions ) cb();
  };
};
