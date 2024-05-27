const messages = {
  en: {
    common: {
      confirm: 'confirm',
      cancel: 'cancel',
      save: 'save',
    },
    tab: {
      Github: 'Github',
      Home: 'Home',
      Translate: 'Translate',
      About: 'About',
      List: 'List',
      Search: 'Search',
    },
    control: {
      first: 'First',
      next: 'Next',
      previous: 'Previous',
      review: 'Preview',
      index: 'Index',
    },
    translate: {
      translatePlaceholder:
        "Press Enter↩ to input '\\n' and press Shift⇧ + Enter↩ to save",
      saveSuccess: 'Saved',
      loadRawWarning: 'A raw json file is loaded',
      loadHistoryInfo: 'A history save is loaded',
      remoteTranslationDetectedTitle: 'Translation Detected',
      remotePreTranslationDetectedTitle: 'PreTranslation Detected',
      remoteTranslationDetectedMeta: 'Click to switch',
      overwriteWarning: 'Overwrite Warning',
      overwriteDetails:
        'A history save of current file is detected. This action will OVERWRITE the existed histroy save',
      switch: {
        title: 'Switch Data Source',
        explanation: {
          raw: 'Raw json file',
          history: 'History save from browser',
          server: 'Translation from community',
          file: 'File from disk',
          gpt: 'GPT pretranslation',
        },
        reloadTooltip: 'Requery translated file existence',
        reloadFinished: 'Requery finished',
      },
      rename: {
        title: 'Rename',
        defaultName: 'Default Name',
        originName: 'Origin Name',
        originNameNotFound: 'Origin name not found',
      },
      preTranslate: {
        options: 'Pre-Translate Options',
        useGithubToken: 'Use Github Token',
        useAPIKey: 'AiHubMix API Key',
        githubWarning:
          'Available for ShinyGroup members with daily request limits',
        keyWarning:
          'NOTE: Your API Key will be transferred via proxy server. The backend service will not save your API key. Use this service only if you trust',
        generalTooltip: 'NOTE: Existed translations will be overwritten',
        translate: 'Translate',
        processing: 'Waiting for pre-translate',
        finished: 'Pre-translate finished！',
        appendTag: 'Append Pre-translation tag',
      },
      tab: {
        rename: 'Rename',
        complete: 'Complete',
        switch: 'Switch',
        top: 'TOP',
        push: 'Push',
        download: 'Download',
        preTranslate: 'preTranslate',
      },
    },
    push: {
      header: {
        title: 'Push to Github',
        login: 'Login',
        logout: 'Logout',
        scope: 'Read and write permission of personal repos required',
        refresh: 'Refresh Status',
      },
      steps: {
        branch: {
          title: 'Choose working branch',
          createFork: 'Create initial branch',
          createBranchPlaceholder: 'New branch name',
          update: 'Update',
          updateConfirm: 'Working branch will pull main repo updates',
          new: 'Create branch',
          progress: {
            loading: 'Loading...',
            promptLogin: 'Please login',
            promptFork: 'Please create initial branch',
            selectBranch: 'Select branch',
            illegalBranch: 'Illegal branch, select another',
            legalBranch: 'Check passed, please click next step',
          },
        },
        upload: {
          title: 'Upload translation to working branch',
          selectUploadPath: 'Select upload path',
          inputStoryName: 'Input card/event name',
          useRecommendedPath: 'Recommended Path',
          uploadSubstepTitle: 'Upload',
          inputCommitMessage: 'Describe what is changed',
          publishPrefix: 'Upload to',
          uploading: 'Uploading...',
          useTemplate: 'Template',
          templatePrefix: 'Add/Modify/Errata:',
        },
        pr: {
          title: 'Create pull request',
          detected:
            'Pull request detected, newly uploaded contents will be included in current PR',
          create: 'Create',
          placeholder: 'Title of PR',
          detailPlaceholder: 'Detail of PR (can leave empty)',
          notCreated: 'PR not created',
          reviewing: 'Please inform the admin to review',
          beforeCreate:
            'Create PR after work is done in case PR is merged before all contents are uploaded',
        },
      },
      explanation: {
        title: 'Not familiar with the git workflow?',
        p1: 'Collaborating on GitHub is like a group of people working together on a document. To avoid confusion caused by everyone directly modifying the original document, we adopt a step-by-step approach.',
        p2: 'Create drafts for modifications, and finally present the content of the draft to the original author for review and merging.',
        step1:
          "Choose a working branch: Create a new draft (working branch) or select an existing one. This allows you to focus on your task, whether it's adding new content or revising existing content, without affecting the original document and the work of others.",
        step2:
          'Upload content to the branch: Save your local work results to your cloud draft.',
        step3:
          'Submit a merge request: Request to merge your modifications from the draft (working branch) back into the original document. This process allows the document author to review your changes and ensure the content is correct before merging.',
      },
    },
    home: {
      history: {
        title: 'History Saves',
        table: {
          name: 'File Name',
          URL: 'URL',
          latestUpdate: 'Latest Update',
        },
        clear: 'CLEAR HISTORY',
        clearWarning: 'Will Clear All History',
      },
      updates: 'Game Updates',
      changelog: 'Changelog',
    },
    list: {
      icon: 'Icon',
      name: 'Name',
      openAt: 'Release',
      translatedStatus: {
        title: 'Translation',
        full: {
          all: 'Translated',
          part: 'Partially Translated',
          no: 'Not Translated',
          empty: 'No Communication',
        },
        short: {
          all: 'Y',
          part: 'P',
          no: 'N',
          empty: '-',
        },
      },
    },
    about: {
      feedback: 'Bug Report / Support',
      userscript: 'Browser User Script: Add link to github csv pages',
      thanks: 'Special Thanks',
      manual: 'User Manual',
    },
  },
  zh: {
    common: {
      confirm: '确认',
      cancel: '取消',
      save: '保存',
    },
    tab: {
      Github: 'Github',
      Home: '主页',
      Translate: '翻译',
      About: '关于',
      List: '列表',
      Search: '语音检索',
    },
    control: {
      first: '回到最初',
      next: '下一节',
      previous: '上一节',
      review: '预览',
      index: '目录',
    },
    translate: {
      translatePlaceholder:
        "按下 Enter↩ 输入 '\\n'，\n按下 Shift⇧ + Enter↩ 保存",
      saveSuccess: '已保存',
      loadRawWarning: '当前加载源为原始 JSON 文件',
      loadHistoryInfo: '已自动加载历史修改',
      remoteTranslationDetectedTitle: '发现翻译文件',
      remotePreTranslationDetectedTitle: '发现预翻译文件',
      remoteTranslationDetectedMeta: '点击此处切换',
      overwriteWarning: '历史修改将被覆盖',
      overwriteDetails:
        '检测到浏览器中当前文件的历史修改，本操作会覆盖历史修改，导致历史修改丢失',
      switch: {
        title: '切换数据源',
        explanation: {
          raw: '原始JSON文件',
          history: '浏览器中的历史修改',
          server: '社区维护的翻译',
          file: '磁盘中的文件',
          gpt: 'GPT 预翻译',
        },
        reloadTooltip: '重新查询翻译文件是否存在',
        reloadFinished: '查询完成',
      },
      rename: {
        title: '设置 CSV 文件名',
        defaultName: '使用缺省名',
        originName: '使用文件原名',
        originNameNotFound: '未找到文件原名',
      },
      preTranslate: {
        options: '预翻译选项',
        useGithubToken: '使用Github凭证',
        useAPIKey: 'AiHubMix API Key',
        githubWarning: '您需要为 ShinyGroup 的成员。每日有限额',
        keyWarning:
          '注意： 您的API Key将会经由代理服务器传输。后端服务不会保存您的API Key。如果您不信任本服务，请勿使用此功能',
        generalTooltip: '注意：已翻译内容会被强制覆盖',
        translate: '翻译',
        processing: '预翻译中，请耐心等待',
        finished: '预翻译已完成！',
        appendTag: '附加预翻译标签',
      },
      tab: {
        rename: '更名',
        complete: '完成',
        switch: '数据源',
        top: 'TOP',
        push: '推送',
        download: '下载',
        preTranslate: '预翻译',
      },
    },
    push: {
      header: {
        title: '推送到Github',
        login: '登录',
        logout: '登出',
        scope: '需要获取私人仓库的读写权限',
        refresh: '更新登录状态',
      },
      steps: {
        branch: {
          title: '选择工作分支',
          createFork: '创建初始分支',
          createBranchPlaceholder: '输入新分支名',
          update: '更新',
          updateConfirm: '工作分支将拉取主仓库更新',
          new: '新建分支',
          progress: {
            loading: '加载中，请稍后',
            promptLogin: '请登录',
            promptFork: '请创建初始分支',
            selectBranch: '请选择分支',
            illegalBranch: '不符要求的分支，请选择其他分支',
            legalBranch: '请点击下一步',
          },
        },
        upload: {
          title: '将翻译上传至工作分支',
          selectUploadPath: '选择上传路径',
          inputStoryName: '请输入卡片/活动名',
          useRecommendedPath: '使用推荐路径',
          uploadSubstepTitle: '上传',
          inputCommitMessage: '概述本次修改的内容，推荐基于模板修改',
          publishPrefix: '上传至',
          uploading: '上传中...',
          useTemplate: '使用模板',
          templatePrefix: '新增/修改/勘误：',
        },
        pr: {
          title: '创建合并请求',
          detected: '已发现合并请求，上传的新内容将自动包含在现有请求中',
          create: '创建合并请求',
          placeholder: '请求的标题，推荐基于模板修改',
          detailPlaceholder: '请求的详细说明，可为空',
          notCreated: '合并请求尚未创建',
          reviewing: '请通知管理员审查合并请求',
          beforeCreate:
            '建议：尽量在工作分支所有更新完成后提交合并请求，避免工作内容被提前合并',
        },
      },
      explanation: {
        title: '不熟悉 git 工作流？',
        p1: '使用Github进行协作就像是一群人共同编辑一份文档。为了避免每个人直接在原文档上修改而导致混乱，我们采取了一种分步骤的方法。',
        p2: '想象一下，有一篇原始文章，我们可以将其复制一份，作为草稿进行修改，最后将草稿的内容呈现给原文作者审查并合并。',
        step1:
          '选择工作分支：创建一个新的草稿（工作分支）或选择一个现有草稿。这样你可以专注于自己的任务，无论是新增内容还是修正现有内容，都不会影响到原始文章和其他人的工作。',
        step2:
          '将内容上传到工作分支：将你的本地工作成果保存到自己的云端草稿中，供他人查看',
        step3:
          '提交合并请求：请求将你的修改从草稿（工作分支）合并回原始文章。这个过程允许文章作者检查你的修改，并在合并前确保内容是正确的。',
      },
    },
    home: {
      history: {
        title: '历史修改',
        table: {
          name: '文件名',
          URL: 'URL',
          latestUpdate: '最后修改',
        },
        clear: '清空历史',
        clearWarning: '将会清除所有历史',
      },
      updates: '游戏更新',
      changelog: '更新日志',
    },
    tips: {
      switch:
        '在翻译文件加载后，可以点击URL输入行最右侧的按钮来切换不同版本的文件',
      extension: '可以安装浏览器扩展以便快速从github页面导航至本网站',
    },
    list: {
      icon: '图标',
      name: '名称',
      openAt: '实装',
      translatedStatus: {
        title: '翻译',
        full: {
          all: '已翻译',
          part: '部分翻译',
          no: '未翻译',
          empty: '无剧情',
        },
        short: {
          all: 'Y',
          part: 'P',
          no: 'N',
          empty: '-',
        },
      },
    },
    about: {
      feedback: 'BUG 反馈 / 技术支持',
      userscript: '浏览器用户脚本：在Github CSV 文件页面添加导航',
      thanks: '特别感谢',
      manual: '用户手册',
    },
  },
}

export { messages }
