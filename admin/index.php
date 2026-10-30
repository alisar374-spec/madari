<?php
/**
 * MADARI — /admin dashboard: WhatsApp conversations, Claude replies, website leads.
 */
declare(strict_types=1);

require __DIR__ . '/../lib/bootstrap.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
session_set_cookie_params(['lifetime' => 0, 'path' => '/admin', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Strict']);
session_name('madari_admin');
session_start();

function e($v): string
{
    return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
}

function csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function when($iso): string
{
    if (!$iso) {
        return '';
    }
    $t = new DateTimeImmutable((string) $iso);
    return $t->setTimezone(new DateTimeZone('Asia/Riyadh'))->format('Y-m-d H:i');
}

const STATUS_LABEL = ['new' => 'جديد', 'open' => 'Claude يتابع', 'needs_human' => 'يحتاج الفريق', 'closed' => 'مغلق'];
const INTENT_LABEL = ['purchase' => 'يبي يشتري', 'inquiry' => 'استفسار', 'complaint' => 'شكوى', 'other' => 'أخرى'];

// ---------- auth ----------
$configured = (string) cfg('admin_password_hash') !== '' && (string) cfg('supabase_url') !== '';
$error = '';

if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: /admin/');
    exit;
}

if (empty($_SESSION['admin']) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $ok = $configured
        && hash_equals((string) cfg('admin_user', 'admin'), (string) ($_POST['user'] ?? ''))
        && password_verify((string) ($_POST['pass'] ?? ''), (string) cfg('admin_password_hash'));
    if ($ok) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        header('Location: /admin/');
        exit;
    }
    sleep(2);
    $error = 'بيانات الدخول غير صحيحة';
}

// ---------- actions ----------
if (!empty($_SESSION['admin']) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!hash_equals(csrf(), (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Bad request');
    }
    $cid = (int) ($_POST['contact'] ?? 0);
    $rows = $cid ? sb_select('contacts', 'id=eq.' . $cid . '&limit=1') : [];
    if ($rows) {
        $c = $rows[0];
        switch ($_POST['action']) {
            case 'status':
                if (array_key_exists((string) ($_POST['status'] ?? ''), STATUS_LABEL)) {
                    sb_update('contacts', 'id=eq.' . $cid, ['status' => $_POST['status']]);
                }
                break;
            case 'ai':
                sb_update('contacts', 'id=eq.' . $cid, ['ai_enabled' => ($_POST['on'] ?? '') === '1']);
                break;
            case 'reply':
                $text = trim((string) ($_POST['text'] ?? ''));
                if ($text !== '') {
                    $id = wa_send_text($c['wa_id'], $text);
                    sb_insert('messages', [
                        'contact_id' => $cid, 'wa_message_id' => $id, 'direction' => 'out',
                        'author' => 'staff', 'body' => $text, 'meta' => ['sent' => $id !== null],
                    ]);
                    sb_update('contacts', 'id=eq.' . $cid, ['last_reply' => mb_substr($text, 0, 500), 'status' => 'open']);
                    $_SESSION['flash'] = $id ? 'تم إرسال الرد' : 'تعذر الإرسال — واتساب يسمح بالرد الحر خلال 24 ساعة من آخر رسالة للعميل فقط';
                }
                break;
        }
    }
    header('Location: /admin/?c=' . $cid);
    exit;
}

$view = empty($_SESSION['admin']) ? 'login' : (isset($_GET['c']) ? 'chat' : (($_GET['tab'] ?? '') === 'leads' ? 'leads' : 'list'));
$flash = $_SESSION['flash'] ?? '';
unset($_SESSION['flash']);
?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<?php if ($view === 'list'): ?><meta http-equiv="refresh" content="60"><?php endif; ?>
<title>لوحة مداري</title>
<link rel="icon" href="/assets/img/logo-mark.svg">
<style>
@font-face { font-family: "Neo Sans Arabic"; src: url("/assets/fonts/NeoSansArabic.ttf") format("truetype"); font-display: swap; }
:root { --navy: #050E36; --navy2: #0A1B5C; --royal: #2350D8; --gold: #CFA64A; --bg: #F4F6FB; --line: #E1E6F2; --muted: #66708A; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "Neo Sans Arabic", Tahoma, sans-serif; background: var(--bg); color: var(--navy); font-size: 15px; }
a { color: var(--royal); text-decoration: none; }
header { background: var(--navy); color: #fff; padding: 14px 20px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
header b { color: var(--gold); font-size: 1.1rem; }
header nav { display: flex; gap: 6px; margin-inline-start: auto; flex-wrap: wrap; }
header nav a { color: #fff; padding: 6px 12px; border-radius: 99px; border: 1px solid rgba(255,255,255,.2); font-size: .9rem; }
header nav a.on { background: var(--gold); color: var(--navy); border-color: var(--gold); }
main { max-width: 1180px; margin: 0 auto; padding: 20px 16px 60px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 18px; }
.stat { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; }
.stat small { color: var(--muted); display: block; }
.stat strong { font-size: 1.6rem; }
.filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.filters a { background: #fff; border: 1px solid var(--line); padding: 5px 12px; border-radius: 99px; font-size: .85rem; color: var(--navy); }
.filters a.on { background: var(--navy2); color: #fff; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { padding: 11px 12px; border-bottom: 1px solid var(--line); text-align: start; vertical-align: top; font-size: .9rem; }
th { background: #FAFBFE; color: var(--muted); font-weight: normal; white-space: nowrap; }
tr:hover td { background: #FAFBFE; }
.pill { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: .78rem; white-space: nowrap; }
.s-new { background: #E6EEFF; color: var(--royal); } .s-open { background: #E7F6EE; color: #1F7A55; }
.s-needs_human { background: #FDECEC; color: #B3261E; } .s-closed { background: #EEE; color: #666; }
.i-purchase { background: #FFF4DC; color: #8A6412; } .i-inquiry { background: #E6EEFF; color: var(--royal); }
.i-complaint { background: #FDECEC; color: #B3261E; } .i-other { background: #EEE; color: #666; }
.muted { color: var(--muted); font-size: .82rem; }
.clip { max-width: 280px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ltr { direction: ltr; unicode-bidi: embed; }
.chat-head { display: flex; gap: 14px; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; margin-bottom: 14px; }
.chat-head h1 { margin: 0 0 4px; font-size: 1.3rem; }
.tools { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.tools form { display: flex; gap: 6px; }
button, select, input, textarea { font: inherit; }
button { background: var(--navy2); color: #fff; border: 0; padding: 8px 14px; border-radius: 10px; cursor: pointer; }
button.gold { background: var(--gold); color: var(--navy); }
button.ghost { background: #fff; color: var(--navy); border: 1px solid var(--line); }
select, input, textarea { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; background: #fff; }
.thread { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.msg { max-width: 78%; padding: 10px 14px; border-radius: 14px; white-space: pre-wrap; line-height: 1.7; }
.msg.in { align-self: flex-start; background: #F1F3F8; }
.msg.out { align-self: flex-end; background: #E9F0FF; }
.msg.staff { background: #FFF4DC; }
.msg .meta { display: block; font-size: .75rem; color: var(--muted); margin-top: 4px; }
.reply { margin-top: 14px; display: flex; gap: 8px; }
.reply textarea { flex: 1; min-height: 70px; }
.summary { background: #FFF9EA; border: 1px solid #F1E2B8; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; }
.flash { background: #E7F6EE; border: 1px solid #BFE5D1; padding: 10px 14px; border-radius: 12px; margin-bottom: 14px; }
.login { max-width: 360px; margin: 10vh auto; background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 28px; display: grid; gap: 12px; }
.login h1 { margin: 0; font-size: 1.3rem; } .err { color: #B3261E; }
@media (max-width: 600px) { .msg { max-width: 92%; } .reply { flex-direction: column; } }
</style>
</head>
<body>
<?php if ($view === 'login'): ?>
  <form class="login" method="post" autocomplete="off">
    <h1>لوحة تحكم مداري</h1>
    <?php if (!$configured): ?><p class="err">لم يتم إعداد ملف الإعدادات الخاص (madari-private/config.php) بعد.</p><?php endif; ?>
    <?php if ($error): ?><p class="err"><?= e($error) ?></p><?php endif; ?>
    <input name="user" placeholder="اسم المستخدم" required>
    <input name="pass" type="password" placeholder="كلمة المرور" required>
    <button class="gold" name="login" value="1">دخول</button>
  </form>
<?php else: ?>
  <header>
    <b>مداري</b><span>لوحة الواتساب و Claude</span>
    <nav>
      <a href="/admin/" class="<?= $view !== 'leads' ? 'on' : '' ?>">المحادثات</a>
      <a href="/admin/?tab=leads" class="<?= $view === 'leads' ? 'on' : '' ?>">طلبات نماذج الموقع</a>
      <a href="/admin/?logout=1">خروج</a>
    </nav>
  </header>
  <main>
  <?php if ($flash): ?><div class="flash"><?= e($flash) ?></div><?php endif; ?>

  <?php if ($view === 'list'):
      $all = sb_select('contacts', 'select=*&order=last_message_at.desc&limit=500');
      $count = fn($f) => count(array_filter($all, $f));
      $fs = (string) ($_GET['status'] ?? '');
      $fi = (string) ($_GET['intent'] ?? '');
      $fsrc = (string) ($_GET['source'] ?? '');
      $list = array_filter($all, fn($c) => ($fs === '' || $c['status'] === $fs) && ($fi === '' || $c['intent'] === $fi) && ($fsrc === '' || $c['source'] === $fsrc));
      $q = fn(array $p) => '/admin/?' . http_build_query(array_filter(array_merge(['status' => $fs, 'intent' => $fi, 'source' => $fsrc], $p)));
  ?>
    <div class="stats">
      <div class="stat"><small>كل العملاء</small><strong><?= count($all) ?></strong></div>
      <div class="stat"><small>جاؤوا من الموقع</small><strong><?= $count(fn($c) => $c['source'] === 'website') ?></strong></div>
      <div class="stat"><small>يحتاجون الفريق</small><strong><?= $count(fn($c) => $c['status'] === 'needs_human') ?></strong></div>
      <div class="stat"><small>يبون يشترون</small><strong><?= $count(fn($c) => $c['intent'] === 'purchase') ?></strong></div>
      <div class="stat"><small>شكاوى</small><strong><?= $count(fn($c) => $c['intent'] === 'complaint') ?></strong></div>
    </div>
    <div class="filters">
      <a href="<?= e($q(['status' => '', 'intent' => '', 'source' => ''])) ?>" class="<?= $fs . $fi . $fsrc === '' ? 'on' : '' ?>">الكل</a>
      <a href="<?= e($q(['source' => $fsrc === 'website' ? '' : 'website'])) ?>" class="<?= $fsrc === 'website' ? 'on' : '' ?>">من الموقع</a>
      <?php foreach (STATUS_LABEL as $k => $v): ?><a href="<?= e($q(['status' => $fs === $k ? '' : $k])) ?>" class="<?= $fs === $k ? 'on' : '' ?>"><?= e($v) ?></a><?php endforeach; ?>
      <?php foreach (INTENT_LABEL as $k => $v): ?><a href="<?= e($q(['intent' => $fi === $k ? '' : $k])) ?>" class="<?= $fi === $k ? 'on' : '' ?>"><?= e($v) ?></a><?php endforeach; ?>
    </div>
    <div class="card"><table>
      <tr><th>العميل</th><th>المصدر</th><th>الحالة</th><th>النية</th><th>آخر رسالة</th><th>رد Claude</th><th>آخر نشاط</th></tr>
      <?php foreach ($list as $c): ?>
      <tr>
        <td><a href="/admin/?c=<?= (int) $c['id'] ?>"><b><?= e($c['name'] ?: 'بدون اسم') ?></b></a><br><span class="muted ltr">+<?= e($c['wa_id']) ?></span></td>
        <td><?= $c['source'] === 'website' ? 'الموقع' : 'واتساب' ?><?php if ($c['source_page']): ?><br><span class="muted ltr"><?= e($c['source_page']) ?></span><?php endif; ?></td>
        <td><span class="pill s-<?= e($c['status']) ?>"><?= e(STATUS_LABEL[$c['status']] ?? $c['status']) ?></span><?php if (!$c['ai_enabled']): ?><br><span class="muted">Claude متوقف</span><?php endif; ?></td>
        <td><?php if ($c['intent']): ?><span class="pill i-<?= e($c['intent']) ?>"><?= e(INTENT_LABEL[$c['intent']] ?? $c['intent']) ?></span><?php endif; ?></td>
        <td><div class="clip"><?= e($c['last_message']) ?></div></td>
        <td><div class="clip"><?= e($c['last_reply']) ?></div></td>
        <td class="muted"><?= e(when($c['last_message_at'])) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$list): ?><tr><td colspan="7" class="muted">لا توجد محادثات بعد.</td></tr><?php endif; ?>
    </table></div>

  <?php elseif ($view === 'chat'):
      $cid = (int) $_GET['c'];
      $rows = sb_select('contacts', 'id=eq.' . $cid . '&limit=1');
      $c = $rows[0] ?? null;
      $msgs = $c ? sb_select('messages', 'contact_id=eq.' . $cid . '&order=created_at.asc&limit=500') : [];
  ?>
    <?php if (!$c): ?><p>المحادثة غير موجودة. <a href="/admin/">رجوع</a></p><?php else: ?>
    <div class="chat-head">
      <div>
        <h1><?= e($c['name'] ?: 'بدون اسم') ?> <a class="muted ltr" href="https://wa.me/<?= e($c['wa_id']) ?>" target="_blank" rel="noopener">+<?= e($c['wa_id']) ?></a></h1>
        <span class="pill s-<?= e($c['status']) ?>"><?= e(STATUS_LABEL[$c['status']] ?? '') ?></span>
        <?php if ($c['intent']): ?><span class="pill i-<?= e($c['intent']) ?>"><?= e(INTENT_LABEL[$c['intent']] ?? '') ?></span><?php endif; ?>
        <span class="muted"> · <?= $c['source'] === 'website' ? 'من الموقع ' . e($c['source_page']) : 'واتساب مباشر' ?> · أول تواصل <?= e(when($c['first_seen_at'])) ?></span>
      </div>
      <div class="tools">
        <form method="post">
          <input type="hidden" name="csrf" value="<?= e(csrf()) ?>"><input type="hidden" name="contact" value="<?= $cid ?>"><input type="hidden" name="action" value="status">
          <select name="status"><?php foreach (STATUS_LABEL as $k => $v): ?><option value="<?= e($k) ?>" <?= $c['status'] === $k ? 'selected' : '' ?>><?= e($v) ?></option><?php endforeach; ?></select>
          <button class="ghost">حفظ الحالة</button>
        </form>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= e(csrf()) ?>"><input type="hidden" name="contact" value="<?= $cid ?>"><input type="hidden" name="action" value="ai">
          <input type="hidden" name="on" value="<?= $c['ai_enabled'] ? '0' : '1' ?>">
          <button class="<?= $c['ai_enabled'] ? 'ghost' : 'gold' ?>"><?= $c['ai_enabled'] ? 'إيقاف Claude (رد بشري)' : 'تشغيل Claude' ?></button>
        </form>
      </div>
    </div>
    <?php if ($c['summary']): ?><div class="summary"><b>ملخص Claude:</b> <?= e($c['summary']) ?></div><?php endif; ?>
    <div class="thread">
      <?php foreach ($msgs as $m):
          $who = $m['author'] === 'customer' ? 'العميل' : ($m['author'] === 'claude' ? 'Claude' : 'الفريق');
          $sent = $m['meta']['sent'] ?? true;
      ?>
        <div class="msg <?= e($m['direction']) ?> <?= $m['author'] === 'staff' ? 'staff' : '' ?>"><?= e($m['body']) ?><span class="meta"><?= e($who) ?> · <?= e(when($m['created_at'])) ?><?php if ($m['intent']): ?> · <?= e(INTENT_LABEL[$m['intent']] ?? $m['intent']) ?><?php endif; ?><?php if (!$sent): ?> · لم يُرسل<?php endif; ?><?php if (!empty($m['meta']['handoff'])): ?> · تحويل للفريق<?php endif; ?></span></div>
      <?php endforeach; ?>
      <?php if (!$msgs): ?><p class="muted">لا توجد رسائل.</p><?php endif; ?>
    </div>
    <form class="reply" method="post">
      <input type="hidden" name="csrf" value="<?= e(csrf()) ?>"><input type="hidden" name="contact" value="<?= $cid ?>"><input type="hidden" name="action" value="reply">
      <textarea name="text" placeholder="اكتب رداً من الفريق يُرسل للعميل على واتساب..." required></textarea>
      <button class="gold">إرسال</button>
    </form>
    <p class="muted">واتساب يسمح بالرد الحر خلال 24 ساعة من آخر رسالة للعميل. لإيقاف ردود Claude على هذا العميل استخدم زر «إيقاف Claude».</p>
    <?php endif; ?>

  <?php else:
      $leads = sb_select('leads', 'select=*&order=created_at.desc&limit=300');
  ?>
    <div class="stats"><div class="stat"><small>طلبات نماذج الموقع</small><strong><?= count($leads) ?></strong></div></div>
    <div class="card"><table>
      <tr><th>التاريخ</th><th>الاسم / الشركة</th><th>التواصل</th><th>الخدمة</th><th>الاحتياج</th><th>الصفحة</th></tr>
      <?php foreach ($leads as $l): ?>
      <tr>
        <td class="muted"><?= e(when($l['created_at'])) ?></td>
        <td><b><?= e($l['name']) ?></b><br><?= e($l['company']) ?><?php if ($l['country']): ?><br><span class="muted"><?= e($l['country']) ?></span><?php endif; ?></td>
        <td class="ltr"><a href="mailto:<?= e($l['email']) ?>"><?= e($l['email']) ?></a><br><?= e($l['phone']) ?></td>
        <td><?= e($l['service'] ?: ($l['form'] ?? '')) ?></td>
        <td><div class="clip"><?= e($l['details']['description'] ?? '') ?></div></td>
        <td class="muted ltr"><?= e($l['page']) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$leads): ?><tr><td colspan="6" class="muted">لا توجد طلبات بعد.</td></tr><?php endif; ?>
    </table></div>
  <?php endif; ?>
  </main>
<?php endif; ?>
</body>
</html>
