/**
 * Create an inject method
 * @param providerScope provider's "this"
 * @param providers a function(name) which returns provider function
 * @param cache place where instances are saved for reuse
 * @returns {Function}
 */
function createInjector(providerScope, providers, cache) {
  providers = providers || angularService;
  cache = cache || {};
  providerScope = providerScope || {};
  /**
   * injection function
   * @param value: string, array, object or function.
   * @param scope: optional function "this"
   * @param args: optional arguments to pass to function after injection
   *              parameters
   * @returns depends on value:
   *   string: return an instance for the injection key.
   *   array of keys: returns an array of instances.
   *   function: look at $inject property of function to determine instances
   *             and then call the function with instances and scope. Any
   *             additional arguments are passed on to function.
   *   object: initialize eager providers and publish them the ones with publish here.
   *   none:   same as object but use providerScope as place to publish.
   */
  return function inject(value, scope, args){
    var returnValue, provider, creation;
    if (isString(value)) {
      if (!cache.hasOwnProperty(value)) {
        provider = providers[value];
        if (!provider) throw "Unknown provider for '"+value+"'.";
        cache[value] = inject(provider, providerScope);
      }
      returnValue = cache[value];
    } else if (isArray(value)) {
      returnValue = [];
      foreach(value, function(name) {
        returnValue.push(inject(name));
      });
    } else if (isFunction(value)) {
      returnValue = inject(value.$inject || []);
      returnValue = value.apply(scope, concat(returnValue, arguments, 2));
    } else if (isObject(value)) {
      foreach(providers, function(provider, name){
        creation = provider.$creation;
        if (creation == 'eager') {
          inject(name);
        }
        if (creation == 'eager-published') {
          setter(value, name, inject(name));
        }
      });
    } else {
      returnValue = inject(providerScope);
    }
    return returnValue;
  };
}