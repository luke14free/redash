import moment from 'moment';
import { isString, any, keys } from 'underscore';

import { Paginator } from '../../utils';
import template from './queries-search-results-page.html';

function QuerySearchCtrl($location, $filter, currentUser, Events, Query, AlertDialog, toastr) {
  // $scope.$parent.pageTitle = 'Queries Search';

  this.selected = {};
  this.term = $location.search().q;
  this.paginator = new Paginator([], { itemsPerPage: 20 });
  this.queries = {};

  this.anySelected = () => any(this.selected);

  this.doArchiveAll = () => {
    keys(this.selected).forEach((id) => {
      Query.delete({ id }, this.loadSearchResults, () => {
        toastr.error('Query could not be archived.');
      });
    });
    this.selected = {};
  };

  this.archiveAll = () => {
    const title = 'Archive Selected Queries';
    const message = 'Are you sure you want to archive selected queries?<br/> All alerts and dashboard widgets created with the selected visualizations will be deleted.';
    const confirm = { class: 'btn-warning', title: 'Archive' };
    AlertDialog.open(title, message, confirm).then(this.doArchiveAll);
  };

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

export default function (ngModule) {
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
