const resolvers = require('./resolvers');
const R = require('ramda');

const getResolved = (data, nodeName) => args => {
  const arr = R.prop(nodeName, data);
  const result = args.reduce((acc, arg) => {
    const name = R.path(['name', 'value'], arg);
    const value = R.path(['value', 'value'], arg);
    const resolver = R.propOr(resolvers.filterKey(name), name, resolvers);
    return resolver(arr, value);
  }, arr);

  return R.assoc(nodeName, result, data)
};

const getItemsResolved = ({ nodeName, props, data }) => {
  return data.reduce((acc, item) => {
    if(typeof(item) === 'object') {
      const obj = R.propOr([], nodeName, item);
      const getFiltered = R.ifElse(
        Array.isArray,
        R.project(props),
        R.identity
      );

      const value = { ...item, [nodeName]: getFiltered(obj) };

      return [...acc, value];
    }

    return acc;
  }, []);
};

const getChildreansResolved = ({ nodeValue, nodeName, selections, data, props, options }) => {
  const getFiltered = R.ifElse(
    Array.isArray,
    R.project(props),
    R.pick(props)
  );

  const filtered = getFiltered(nodeValue || []);

  const result = selections.reduce((acc, sel) => {
    const value = getQueryResolved(sel, filtered, options);
    return options.get ? value : R.assoc(nodeName, value, acc)
  }, data);

  return result;
};

function getQueryResolved(ast, data = {}, options) {
  const nodeName = R.path(['name', 'value'], ast);
  const selections = R.pathOr([], ['selectionSet', 'selections'], ast);
  const props = R.map(R.path(['name', 'value']), selections);
  const astArgs = R.propOr([], 'arguments', ast);
  const dataResolved = R.ifElse(
    R.isEmpty,
    R.always(data),
    getResolved(data, nodeName)
  )(astArgs);

  const nodeValue = R.prop(nodeName, dataResolved);

  if(Array.isArray(data)) {
    return getItemsResolved({ nodeName, props, data: dataResolved })
  }

  return getChildreansResolved({
    data: dataResolved,
    selections,
    nodeValue,
    nodeName,
    options,
    props,
  })
}

 module.exports = {
  getQueryResolved
};
