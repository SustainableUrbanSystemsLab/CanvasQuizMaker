// ===== QUIZ PARSER =====
function parseQuizText(text) {
  const chapters = [];
  const chapterRegex = /###\s*\*\*Chapter\s+(\d+):\s*([^*]+)\*\*/gi;

  const chapterMatches = [...text.matchAll(chapterRegex)];

  if (chapterMatches.length === 0) {
    const questions = parseQuestions(text);
    if (questions.length > 0) {
      chapters.push({
        number: 1,
        title: 'Quiz Questions',
        questions: questions
      });
    }
  } else {
    for (let i = 0; i < chapterMatches.length; i++) {
      const match = chapterMatches[i];
      const chapterNumber = match[1];
      const chapterTitle = match[2].trim();

      const startIndex = match.index + match[0].length;
      const endIndex = i < chapterMatches.length - 1
        ? chapterMatches[i + 1].index
        : text.length;

      const chapterContent = text.substring(startIndex, endIndex);
      const questions = parseQuestions(chapterContent);

      if (questions.length > 0) {
        chapters.push({
          number: parseInt(chapterNumber),
          title: chapterTitle,
          questions: questions
        });
      }
    }
  }

  return chapters;
}

function parseQuestions(text) {
  const questions = [];
  const lines = text.split('\n');
  let currentQuestion = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      const questionNumber = parseInt(questionMatch[1]);
      const questionText = questionMatch[2];
      const questionType = detectQuestionType(lines, i + 1);

      currentQuestion = {
        number: questionNumber,
        text: questionText,
        type: questionType,
        options: [],
        correctAnswers: [],
        answers: []
      };

      i++;
      continue;
    }

    if (currentQuestion) {
      if (currentQuestion.type === 'multiple_choice_question' || currentQuestion.type === 'true_false_question') {
        const optionMatch = line.match(/^\*?([a-d])\)\s+(.+)/);
        if (optionMatch) {
          const isCorrect = line.startsWith('*');
          currentQuestion.options.push({
            letter: optionMatch[1],
            text: optionMatch[2],
            isCorrect: isCorrect
          });
          if (isCorrect) currentQuestion.correctAnswers.push(optionMatch[1]);
        }
      } else if (currentQuestion.type === 'multiple_answers_question') {
        const multiMatch = line.match(/^\[(\*?)\]\s+(.+)/);
        if (multiMatch) {
          const isCorrect = multiMatch[1] === '*';
          currentQuestion.options.push({
            text: multiMatch[2],
            isCorrect: isCorrect
          });
          if (isCorrect) currentQuestion.correctAnswers.push(multiMatch[2]);
        }
      } else if (currentQuestion.type === 'short_answer_question') {
        const answerMatch = line.match(/^\*\s+(.+)/);
        if (answerMatch) {
          currentQuestion.answers.push(answerMatch[1].trim());
        }
      }
    }

    i++;
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
}

function detectQuestionType(lines, startIndex) {
  for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.match(/^#{3,4}$/)) return 'essay_question';
    if (line.match(/^\^{3,4}$/)) return 'file_upload_question';
    if (line.match(/^\[(\*?)\]/)) return 'multiple_answers_question';
    if (line.match(/^\*\s+[^a-d]/)) return 'short_answer_question';
    if (line.match(/^\*?[ab]\)\s+(True|False)/i)) return 'true_false_question';
    if (line.match(/^\*?[a-d]\)/)) return 'multiple_choice_question';
  }
  return 'multiple_choice_question';
}

// ===== QTI GENERATOR =====
function generateQTI(chapters, quizTitle = 'Imported Quiz') {
  const assessmentId = 'assessment_' + Date.now();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${assessmentId}" title="${escapeXml(quizTitle)}">
    <qtimetadata>
      <qtimetadatafield>
        <fieldlabel>cc_maxattempts</fieldlabel>
        <fieldentry>1</fieldentry>
      </qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">`;

  chapters.forEach(chapter => {
    chapter.questions.forEach(question => {
      xml += generateQuestionXml(question, chapter);
    });
  });

  xml += `
    </section>
  </assessment>
</questestinterop>`;

  return xml;
}

function generateQuestionXml(question, chapter) {
  const questionId = 'question_' + chapter.number + '_' + question.number;

  switch (question.type) {
    case 'multiple_choice_question':
    case 'true_false_question':
      return generateMultipleChoiceXml(question, chapter, questionId);
    case 'multiple_answers_question':
      return generateMultipleAnswersXml(question, chapter, questionId);
    case 'short_answer_question':
      return generateShortAnswerXml(question, chapter, questionId);
    case 'essay_question':
      return generateEssayXml(question, chapter, questionId);
    case 'file_upload_question':
      return generateFileUploadXml(question, chapter, questionId);
    default:
      return generateMultipleChoiceXml(question, chapter, questionId);
  }
}

function generateMultipleChoiceXml(question, chapter, questionId) {
  const responseId = 'response_' + questionId;
  let xml = `
      <item ident="${questionId}" title="Chapter ${chapter.number} - Q${question.number}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>${question.type}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>1</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(question.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_lid ident="${responseId}" rcardinality="Single">
            <render_choice>`;

  question.options.forEach((option, idx) => {
    const choiceId = `${questionId}_${option.letter || idx}`;
    xml += `
              <response_label ident="${choiceId}">
                <material>
                  <mattext texttype="text/plain">${escapeXml(option.text)}</mattext>
                </material>
              </response_label>`;
  });

  xml += `
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>`;

  const correctOption = question.options.find(opt => opt.isCorrect);
  if (correctOption) {
    const correctId = `${questionId}_${correctOption.letter || question.options.indexOf(correctOption)}`;
    xml += `
          <respcondition continue="No">
            <conditionvar>
              <varequal respident="${responseId}">${correctId}</varequal>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>`;
  }

  xml += `
        </resprocessing>
      </item>`;

  return xml;
}

function generateMultipleAnswersXml(question, chapter, questionId) {
  const responseId = 'response_' + questionId;
  let xml = `
      <item ident="${questionId}" title="Chapter ${chapter.number} - Q${question.number}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>multiple_answers_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>1</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(question.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_lid ident="${responseId}" rcardinality="Multiple">
            <render_choice>`;

  question.options.forEach((option, idx) => {
    const choiceId = `${questionId}_${idx}`;
    xml += `
              <response_label ident="${choiceId}">
                <material>
                  <mattext texttype="text/plain">${escapeXml(option.text)}</mattext>
                </material>
              </response_label>`;
  });

  xml += `
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <and>`;

  question.options.forEach((option, idx) => {
    const choiceId = `${questionId}_${idx}`;
    if (option.isCorrect) {
      xml += `
                <varequal respident="${responseId}">${choiceId}</varequal>`;
    } else {
      xml += `
                <not><varequal respident="${responseId}">${choiceId}</varequal></not>`;
    }
  });

  xml += `
              </and>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>`;

  return xml;
}

function generateShortAnswerXml(question, chapter, questionId) {
  const responseId = 'response_' + questionId;
  let xml = `
      <item ident="${questionId}" title="Chapter ${chapter.number} - Q${question.number}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>short_answer_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>1</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(question.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_str ident="${responseId}" rcardinality="Single">
            <render_fib>
              <response_label ident="answer1"/>
            </render_fib>
          </response_str>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>`;

  question.answers.forEach(answer => {
    xml += `
          <respcondition continue="No">
            <conditionvar>
              <varequal respident="${responseId}" case="no">${escapeXml(answer)}</varequal>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>`;
  });

  xml += `
        </resprocessing>
      </item>`;

  return xml;
}

function generateEssayXml(question, chapter, questionId) {
  const responseId = 'response_' + questionId;
  return `
      <item ident="${questionId}" title="Chapter ${chapter.number} - Q${question.number}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>essay_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>0</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(question.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_str ident="${responseId}" rcardinality="Single">
            <render_fib fibtype="String" rows="10" columns="80">
              <response_label ident="answer1"/>
            </render_fib>
          </response_str>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="0" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
        </resprocessing>
      </item>`;
}

function generateFileUploadXml(question, chapter, questionId) {
  const responseId = 'response_' + questionId;
  return `
      <item ident="${questionId}" title="Chapter ${chapter.number} - Q${question.number}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>file_upload_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>0</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(question.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_str ident="${responseId}" rcardinality="Single">
            <render_fib fibtype="File">
              <response_label ident="answer1"/>
            </render_fib>
          </response_str>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="0" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
        </resprocessing>
      </item>`;
}

function generateManifest(assessmentFileName) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="manifest_1" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsmd_v1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd http://ltsc.ieee.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2p2.xsd">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1.3</schemaversion>
  </metadata>
  <organizations/>
  <resources>
    <resource identifier="resource_1" type="imsqti_xmlv1p2">
      <file href="${assessmentFileName}"/>
    </resource>
  </resources>
</manifest>`;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ===== PREVIEW GENERATOR =====
function generatePreview(chapters) {
  if (chapters.length === 0) {
    return '<div class="empty-state"><p>No valid questions found. Please check your format.</p></div>';
  }

  let html = '';

  chapters.forEach(chapter => {
    html += `<div class="preview-chapter">`;
    html += `<h3>Chapter ${chapter.number}: ${escapeHtml(chapter.title)}</h3>`;

    chapter.questions.forEach(question => {
      html += `<div class="preview-question">`;
      html += `<div class="question-text">${question.number}. ${escapeHtml(question.text)} <span class="question-type-badge">${getTypeLabel(question.type)}</span></div>`;

      if (question.type === 'multiple_choice_question' || question.type === 'true_false_question') {
        html += `<ul class="options">`;
        question.options.forEach(option => {
          const correctClass = option.isCorrect ? ' correct' : '';
          html += `<li class="option${correctClass}">${option.letter}) ${escapeHtml(option.text)}</li>`;
        });
        html += `</ul>`;
      } else if (question.type === 'multiple_answers_question') {
        html += `<ul class="options">`;
        question.options.forEach(option => {
          const correctClass = option.isCorrect ? ' correct' : '';
          const marker = option.isCorrect ? '[✓]' : '[ ]';
          html += `<li class="option${correctClass}">${marker} ${escapeHtml(option.text)}</li>`;
        });
        html += `</ul>`;
      } else if (question.type === 'short_answer_question') {
        html += `<div class="short-answers"><p><strong>Accepted answers:</strong></p><ul class="options">`;
        question.answers.forEach(answer => {
          html += `<li class="option correct">${escapeHtml(answer)}</li>`;
        });
        html += `</ul></div>`;
      } else if (question.type === 'essay_question') {
        html += `<p class="essay-note">Essay response (manual grading required)</p>`;
      } else if (question.type === 'file_upload_question') {
        html += `<p class="file-note">File upload (manual grading required)</p>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
  });

  return html;
}

function getTypeLabel(type) {
  const labels = {
    'multiple_choice_question': 'Multiple Choice',
    'multiple_answers_question': 'Multiple Answers',
    'true_false_question': 'True/False',
    'short_answer_question': 'Short Answer',
    'essay_question': 'Essay',
    'file_upload_question': 'File Upload'
  };
  return labels[type] || type;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== ZIP GENERATION =====
async function createQTIPackage(chapters, quizTitle = 'quiz') {
  const zip = new JSZip();

  const assessmentFileName = 'assessment.xml';
  const manifestFileName = 'imsmanifest.xml';

  const qtiXml = generateQTI(chapters, quizTitle);
  const manifestXml = generateManifest(assessmentFileName);

  zip.file(assessmentFileName, qtiXml);
  zip.file(manifestFileName, manifestXml);

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${quizTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qti.zip`;
  saveAs(blob, filename);
}

// ===== EVENT HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
  const quizInput = document.getElementById('quizInput');
  const generateBtn = document.getElementById('generateBtn');
  const previewBtn = document.getElementById('previewBtn');
  const clearBtn = document.getElementById('clearBtn');
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  const previewSection = document.getElementById('previewSection');
  const previewContent = document.getElementById('previewContent');
  const loadingOverlay = document.getElementById('loadingOverlay');

  if (!localStorage.getItem('hasVisited')) {
    quizInput.value = getSampleQuiz();
    localStorage.setItem('hasVisited', 'true');
  }

  generateBtn.addEventListener('click', async () => {
    const text = quizInput.value.trim();

    if (!text) {
      alert('Please enter some quiz questions!');
      return;
    }

    loadingOverlay.classList.add('active');

    try {
      const chapters = parseQuizText(text);

      if (chapters.length === 0) {
        alert('No valid questions found. Please check your formatting.');
        loadingOverlay.classList.remove('active');
        return;
      }

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const quizTitle = chapter.title !== 'Quiz Questions'
          ? `Chapter ${chapter.number} ${chapter.title}`
          : 'Quiz';

        await createQTIPackage([chapter], quizTitle);

        if (i < chapters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setTimeout(() => {
        loadingOverlay.classList.remove('active');
        alert(`Successfully generated ${chapters.length} QTI package${chapters.length > 1 ? 's' : ''}!`);
      }, 500);
    } catch (error) {
      console.error('Error generating QTI:', error);
      alert('An error occurred while generating the QTI package. Please check your input format.');
      loadingOverlay.classList.remove('active');
    }
  });

  previewBtn.addEventListener('click', () => {
    const text = quizInput.value.trim();

    if (!text) {
      alert('Please enter some quiz questions!');
      return;
    }

    const chapters = parseQuizText(text);
    const previewHtml = generatePreview(chapters);

    previewContent.innerHTML = previewHtml;
    previewSection.classList.add('active');

    if (window.innerWidth < 1024) {
      previewSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  closePreviewBtn.addEventListener('click', () => {
    previewSection.classList.remove('active');
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all input?')) {
      quizInput.value = '';
      previewSection.classList.remove('active');
    }
  });

  // Theme Toggle Logic
  const themeBtns = document.querySelectorAll('.theme-btn');
  const html = document.documentElement;

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // Initial theme setup
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Default to system preference if no saved preference
    // But since our default CSS is dark, we only need to act if system is light
    // Actually, let's just set the active button to system
    updateActiveButton('system');
    if (systemTheme === 'light') {
      html.setAttribute('data-theme', 'light');
    }
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme') || localStorage.getItem('theme') === 'system') {
      const newTheme = e.matches ? 'dark' : 'light';
      if (newTheme === 'light') {
        html.setAttribute('data-theme', 'light');
      } else {
        html.removeAttribute('data-theme');
      }
    }
  });

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);

      if (theme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', theme);
      }
    });
  });

  function applyTheme(theme) {
    updateActiveButton(theme);

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (systemTheme === 'light') {
        html.setAttribute('data-theme', 'light');
      } else {
        html.removeAttribute('data-theme');
      }
    } else if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
  }

  function updateActiveButton(theme) {
    themeBtns.forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
});

// ===== SAMPLE QUIZ DATA =====
function getSampleQuiz() {
  return `### **Chapter 1: Sample Questions**

1. What is 2+3?
a) 6
b) 1
*c) 5
d) 10

2. Which of the following are dinosaurs?
[ ] Woolly mammoth
[*] Tyrannosaurus rex
[*] Triceratops
[ ] Smilodon fatalis

3. Who lives at the North Pole?
* Santa
* Santa Claus
* Father Christmas

4. Water is liquid.
*a) True
b) False`;
}
