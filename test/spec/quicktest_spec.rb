require 'selenium-webdriver'
require 'appium_lib'
require 'yaml'
require File.join(File.expand_path(File.dirname(__FILE__)), 'spec_helper')
require File.join(File.expand_path(File.dirname(__FILE__)), 'app_spec_helpers')
require_relative './pages/login_page.rb'
require_relative './pages/me_page.rb'
require_relative './pages/teams_page.rb'
require_relative './pages/page.rb'
require_relative './pages/project_page.rb'

shared_examples 'app' do |webdriver_url, browser_capabilities|

  # Helpers

  include AppSpecHelpers

  # Start a webserver for the web app before the tests

  before :all do
    @wait = Selenium::WebDriver::Wait.new(timeout: 10)

    @email = "sysops+#{Time.now.to_i}#{Process.pid}@meedan.com"
    @password = '12345678'
    @source_url = 'https://twitter.com/ironmaiden?timestamp=' + Time.now.to_i.to_s
    @media_url = 'https://twitter.com/meedan/status/773947372527288320/?t=' + Time.now.to_i.to_s
    @config = YAML.load_file('config.yml')
    $source_id = nil
    $media_id = nil
    @e1 = 'sysops+' + Time.now.to_i.to_s + '@meedan.com'
    @t1 = 'team1' + Time.now.to_i.to_s
    @t2 = 'team2' + Time.now.to_i.to_s
    @new_tag = nil

    FileUtils.cp(@config['config_file_path'], '../build/web/js/config.js') unless @config['config_file_path'].nil?

    @driver =  Selenium::WebDriver.for(:remote, url: webdriver_url, desired_capabilities: browser_capabilities)

    # TODO: better initialization w/ parallelization
    page = LoginPage.new(config: @config, driver: @driver).load
  end

  # Close the testing webserver after all tests run

  after :all do
    FileUtils.cp('../config.js', '../build/web/js/config.js')
  end

  # Start Google Chrome before each test

  before :each do
    @driver = Selenium::WebDriver.for(:remote, url: webdriver_url, desired_capabilities: browser_capabilities)
  end

  # Close Google Chrome after each test

  after :each do |example|
    if example.exception
      require 'rest-client'
      path = '/tmp/' + (0...8).map{ (65 + rand(26)).chr }.join + '.png'
      @driver.save_screenshot(path) # TODO: fix for page model tests
      response = RestClient.post('https://file.io?expires=2', file: File.new(path))
      link = JSON.parse(response.body)['link']
      puts "Test \"#{example.to_s}\" failed! Check screenshot at #{link} and following browser output: #{console_logs}"
    end
    @driver.quit
  end

  # The tests themselves start here
  context "web" do
    ## Prioritized Script for Automation ##
    it "should register and login using e-mail" do
      p "should register and login using e-mail"
      login_pg = LoginPage.new(config: @config, driver: @driver).load
      email, password = ['sysops+' + Time.now.to_i.to_s + '@meedan.com', '22345678']
      login_pg.register_and_login_with_email(email: email, password: password)
      me_pg = MePage.new(config: @config, driver: login_pg.driver).load # reuse tab
      displayed_name = me_pg.title
      expect(displayed_name == 'User With Email').to be(true)
    end

    it "should login using Facebook" do
      p "should login using Facebook"
      login_pg = LoginPage.new(config: @config, driver: @driver).load
      login_pg.login_with_facebook
      me_pg = MePage.new(config: @config, driver: login_pg.driver).load
      displayed_name = me_pg.title
      expected_name = @config['facebook_name']
      expect(displayed_name).to eq(expected_name)
    end

    it "should login using Twitter" do
      p "should login using Twitter"
      login_with_twitter
      @driver.navigate.to @config['self_url'] + '/check/me'
      displayed_name = get_element('h2.source-name').text.upcase
      expected_name = @config['twitter_name'].upcase
      expect(displayed_name == expected_name).to be(true)
    end

    it "should login using Slack" do
      p "should login using Slack"
      @driver.navigate.to "https://#{@config['slack_domain']}.slack.com"
      fill_field('#email', @config['slack_user'])
      fill_field('#password', @config['slack_password'])
      press_button('#signin_btn')
      page = LoginPage.new(config: @config, driver: @driver).load
      sleep 10
      element = page.driver.find_element(:id, "slack-login")
      element.click
      sleep 2
      window = @driver.window_handles.last
      @driver.switch_to.window(window)
      press_button('#oauth_authorizify')
      sleep 5
      window = @driver.window_handles.first
      @driver.switch_to.window(window)
      @driver.navigate.to @config['self_url'] + '/check/me'
      sleep 10
      expect(get_element('h2.source-name').text.nil?).to be(false)
    end

    #Create two new teams.
    it "should create 2 teams" do
      p "should create 2 teams"
      page = LoginPage.new(config: @config, driver: @driver).load
          .register_and_login_with_email(email: @e1, password: @password)
          .create_team(name: @t1, slug:@t1)
      page = CreateTeamPage.new(config: @config, driver: page.driver).load
          .create_team(name: @t2, slug:@t2)
      expect(get_element('h1.team__name').text.nil?).to be(false)
    end

    #As a different user, request to join one team.
    it "should join team" do
      p "should join team"
      page = LoginPage.new(config: @config, driver: @driver).load
          .register_and_login_with_email(email: 'newsysops+' + Time.now.to_i.to_s + '@meedan.com', password: '22345678')
      page = TeamsPage.new(config: @config, driver: @driver).load
          .ask_join_team(subdomain: @t1)
      sleep 3
      expect(@driver.find_element(:class, "message").nil?).to be(false)
    end

    #As the group creator, go to the members page and approve the joining request.
    it "should as the group creator, go to the members page and approve the joining request" do
      p ".approve_join_team"
      page = LoginPage.new(config: @config, driver: @driver).load.login_with_email(email: @e1, password: @password)
      page = TeamsPage.new(config: @config, driver: @driver).load
          .approve_join_team(subdomain: @t1)
      elems = @driver.find_elements(:css => ".team-members__list > li")
      expect(elems.size).to be > 1
    end

    #Switch teams
    it "should switch teams" do
      p "should switch teams"
      page = LoginPage.new(config: @config, driver: @driver).load.login_with_email(email: @e1, password: @password)
      page = TeamsPage.new(config: @config, driver: @driver).load
          .select_team(name: @t1)
      page = TeamsPage.new(config: @config, driver: @driver).load
          .select_team(name: @t2)
      sleep 3
      expect(page.team_name).to eq(@t2)
    end

    #Add slack notificatios to a team
    it "should add slack notifications to a team " do
      p "should add slack notifications to a team "
      page = LoginPage.new(config: @config, driver: @driver).load
          .login_with_email(email: @e1, password: @password)
      @driver.navigate.to @config['self_url'] + '/' + @t2
      sleep 2
      element = @driver.find_element(:class, "team__edit-button")
      element.click
      sleep 2
      element = @driver.find_element(:id, "team__settings-slack-notifications-enabled")
      sleep 2
      element.click
      element = @driver.find_element(:id, "team__settings-slack-webhook")
      sleep 2
      element.click
      element.send_keys "https://hooks.slack.com/services/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"
      sleep 2
      element = @driver.find_element(:class, "team__save-button")
      element.click
      sleep 2
      expect(@driver.find_element(:class, "message").nil?).to be(false)
    end

    #Create a new project.
    it "should create a project for a team " do
      p "should create a project for a team"
      page = LoginPage.new(config: @config, driver: @driver).load
          .login_with_email(email: @e1, password: @password, project: true)
      name = "Project #{Time.now}"
      element = @driver.find_element(:id, "create-project-title")
      sleep 2
      element.click
      element.send_keys name
      @driver.action.send_keys("\n").perform
      sleep 2
      expect(get_element('h2.project-header__title').text.nil?).to be(false)
    end


    #Create a new media using a link from:     #Facebook      #YouTube     #Twitter     #  Instagram
    it "should create project media" do
      p "should create project media"
      media_pg = LoginPage.new(config: @config, driver: @driver).load
          .login_with_email(email: @e1, password: @password, project: true)
          .create_media(input: 'https://twitter.com/marcouza/status/771009514732650497?t=' + Time.now.to_i.to_s)
      expect(media_pg.contains_string?('Added')).to be(true)
      project_pg = media_pg.go_to_project
      sleep 2
      media_pg = project_pg.create_media(input: 'https://www.facebook.com/FirstDraftNews/posts/1808121032783161?t=' + Time.now.to_i.to_s)
      expect(media_pg.contains_string?('Added')).to be(true)
      project_pg = media_pg.go_to_project
      sleep 2
      media_pg = project_pg.create_media(input: 'https://www.youtube.com/watch?v=ykLgjhBnik0?t=' + Time.now.to_i.to_s)
      expect(media_pg.contains_string?('Added')).to be(true)
      project_pg = media_pg.go_to_project
      sleep 2
      media_pg = project_pg.create_media(input: 'https://www.instagram.com/p/BIHh6b0Ausk?t=' + Time.now.to_i.to_s)
      expect(media_pg.contains_string?('Added')).to be(true)
      $media_id = media_pg.driver.current_url.to_s.match(/\/media\/([0-9]+)$/)[1]
      expect($media_id.nil?).to be(false)
    end

    #Add comment to your media.
    it "should add comment to your media" do
      p "add comment to your media"
      media_pg = LoginPage.new(config: @config, driver: @driver).load
          .login_with_email(email: @e1, password: @password, project: true)
      @driver.navigate.to team_url('project/' + get_project + '/media/' + $media_id)
      sleep 1
      # First, verify that there isn't any comment
      expect(@driver.page_source.include?('This is my comment')).to be(false)
      # Add a comment as a command
      fill_field('#cmd-input', '/comment This is my comment')
      @driver.action.send_keys(:enter).perform
      sleep 2
      # Verify that comment was added to annotations list
      expect(@driver.page_source.include?('This is my comment')).to be(true)
      # Reload the page and verify that comment is still there
      @driver.navigate.refresh
      sleep 3
      expect(@driver.page_source.include?('This is my comment')).to be(true)

      #delete your comment.
      p "delete your comment"
      element = @driver.find_element(:css, "svg.menu-button__icon")
      element.click
      sleep 3
      element = @driver.find_element(:class, "annotation__delete")
      element.click
      sleep 3
      expect(@driver.page_source.include?('This is my comment')).to be(false)
    end

    #Set a verification status to this media.
    it "should change a media status via the dropdown menu" do
      p "should change a media status via the dropdown menu"
      media_pg = LoginPage.new(config: @config, driver: @driver).load
          .login_with_email(email: @e1, password: @password, project: true)
      @driver.navigate.to team_url('project/' + get_project + '/media/' + $media_id)
      sleep 3
      element = @driver.find_element(:css, ".media-status__label")
      element.click
      element = @driver.find_element(:css, ".media-status__menu-item--verified")
      element.click
      sleep 3
      element = @driver.find_element(:css, '.annotation__status--verified')
      expect(element.nil?).to be(false)
    end

    #Add a tag to your media.
    it "should Add a tag to your media and delete it" do
      p "Add a tag to your media."
      page = LoginPage.new(config: @config, driver: @driver).load
          .login_with_email(email: @e1, password: @password)
          .click_media
      @new_tag = Time.now.to_i.to_s
      page.add_tag(@new_tag)
      sleep 2
      expect(page.has_tag?(@new_tag)).to be(true)
      #Delete this tag.
      p "delete this tag"
      page.delete_tag(@new_tag)
      sleep 2
      expect(page.has_tag?(@new_tag)).to be(false)
    end
  end
end