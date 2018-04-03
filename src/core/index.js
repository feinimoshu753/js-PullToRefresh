import _detault from './default';
import event from './event';
import throttleCreater from '../util/throttle_creater';

function PullToRefresh(options) {
    this.options = Object.assign({}, _detault, options);
}

PullToRefresh.prototype.autoRefresh = function () {

};

PullToRefresh.prototype.stop = function () {

};

PullToRefresh.prototype.destroy = function () {

};

export default PullToRefresh;

