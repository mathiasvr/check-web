import React from 'react';
import { IntlProvider } from 'react-intl';
import { mountWithIntl } from './helpers/intl-test';
import { TeamTasksComponent } from '../../src/app/components/team/TeamTasks';

const team = {
  team_tasks: {
    edges: [],
  },
  projects: {
    edges: [],
  },
};

const direction = {
  from: 'left',
  to: 'right',
};

describe('<TeamTasksComponent />', () => {
  it('should render filter and create task button', function() {
    const wrapper = mountWithIntl(
      <TeamTasksComponent team={team} direction={direction} />
    );
    expect(wrapper.find('.filter-popup').hostNodes()).toHaveLength(1);
    expect(wrapper.find('.create-task__add-button').hostNodes()).toHaveLength(1);
    expect(wrapper.html()).toMatch('Tasks');
  });
});
