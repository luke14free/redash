import moment from 'moment';
import { isString, any, pairs } from 'underscore';

import { Paginator } from '../../utils';
import template from './queries-search-results-page.html';
import multiSelectTemplate from './multi-query-select.html';


function QuerySearchCtrl($location, $filter, currentUser, Events, Query) {
  // $scope.$parent.pageTitle = 'Queries Search';

  this.term = $location.search().q;
  this.paginator = new Paginator([], { itemsPerPage: 20 });
  this.queries = {};

  this.loadSearchResults = () => {
    Query.search({ q: this.term }, (results) => {
      const queries = results.map((query) => {
        this.queries[query.id] = query;
        query.created_at = moment(query.created_at);
        return query;
      });

      this.paginator.updateRows(queries);
    });
  };

  this.loadSearchResults();

  this.search = () => {
    if (!isString(this.term) || this.term.trim() === '') {
      this.paginator.updateRows([]);
    } else {
      $location.search({ q: this.term });
    }
  };

  Events.record('search', 'query', '', { term: this.term });
}

function multiQuerySelect(AlertDialog, Query, toastr) {
  this.anySelected = () => any(this.queries);

  this.doArchiveAll = () => {
    pairs(this.queries).forEach(([id, query]) => {
      if (query.selected) {
        Query.delete({ id }, this.refresh, () => {
          toastr.error('Query could not be archived.');
        });
      }
    });
    this.queries = [];
  };

  this.archiveAll = () => {
    const title = 'Archive Selected Queries';
    const message = 'Are you sure you want to archive selected queries?<br/> All alerts and dashboard widgets created with the selected visualizations will be deleted.';
    const confirm = { class: 'btn-warning', title: 'Archive' };
    AlertDialog.open(title, message, confirm).then(this.doArchiveAll);
  };

  this.refreshAll = () => {
    pairs(this.queries).forEach(([, query]) => {
      if (query.selected) {
        query.reloading = true;
        try {
          query.getQueryResultPromise(0).then(() => {
            query.reloading = false;
            toastr.success(`Refreshed ${query.name}`);
            query.selected = false;
          });
        } catch (e) {
          toastr.error(`Cannot refresh ${query.name}`);
          query.reloading = false;
          query.selected = false;
        }
      }
    });
  };
}

export default function (ngModule) {
  ngModule.component('multiQuerySelect', {
    template: multiSelectTemplate,
    controller: multiQuerySelect,
    bindings: {
      refresh: '=',
      queries: '=',
    },
  });

  ngModule.component('queriesSearchResultsPage', {
    template,
    controller: QuerySearchCtrl,
  });

  return {
    '/queries/search': {
      template: '<queries-search-results-page></queries-search-results-page>',
      reloadOnSearch: true,
    },
  };
}
