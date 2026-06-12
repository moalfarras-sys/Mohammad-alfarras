package com.mo.moplayer.ui.epg

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.EpgEntity
import com.mo.moplayer.databinding.ActivityEpgGuideBinding
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.livetv.ArchiveActivity
import com.mo.moplayer.ui.livetv.LiveTvActivity
import dagger.hilt.android.AndroidEntryPoint
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Full multi-channel program guide — the TiviMate-style grid. Channels scroll vertically
 * (real focus per row); the time axis scrolls horizontally under a cursor the activity
 * drives directly with left/right, so there are no per-program focusable views to bloat a
 * weak box. OK tunes to the channel live (or opens catch-up for a finished program on an
 * archive channel).
 */
@AndroidEntryPoint
class EpgGuideActivity : BaseTvActivity() {

    override val screenId: String = "epg_guide"
    override val enableFocusTracking: Boolean = false
    override val restoreFocusOnResume: Boolean = false

    private lateinit var binding: ActivityEpgGuideBinding
    private val viewModel: EpgGuideViewModel by viewModels()

    private lateinit var guideAdapter: EpgGuideAdapter
    private lateinit var categoryAdapter: GuideCategoryAdapter

    // Shared time axis state.
    private val pxPerMinutePx by lazy { 4.5f * resources.displayMetrics.density }
    private var windowStartMs = 0L
    private var windowEndMs = 0L
    private var scrollPx = 0f
    private var viewportWidthPx = 0f

    // Cursor.
    private var focusedChannelIndex = 0
    private var focusTimeMs = System.currentTimeMillis()
    private var currentFocusedProgram: EpgEntity? = null
    private var pendingInitialFocus = true

    private val clockFmt = SimpleDateFormat("HH:mm", Locale.getDefault())
    private val tickHandler = Handler(Looper.getMainLooper())
    private var tickCount = 0
    private val tickRunnable = object : Runnable {
        override fun run() {
            binding.tvGuideClock.text = clockFmt.format(Date())
            tickCount++
            if (tickCount % 20 == 0) pushGridState() // advance now-line + live highlight
            tickHandler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEpgGuideBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupGrid()
        setupCategories()
        setupHeaderActions()
        observeViewModel()

        binding.tvGuideClock.text = clockFmt.format(Date())
        binding.timeRuler.addOnLayoutChangeListener { _, l, _, r, _, _, _, _, _ ->
            val w = (r - l).toFloat()
            if (w > 0f && w != viewportWidthPx) {
                viewportWidthPx = w
                pushGridState()
            }
        }
    }

    private fun setupGrid() {
        guideAdapter = EpgGuideAdapter(
            onRowFocused = { pos -> onRowFocused(pos) },
            onRowSelected = { pos ->
                focusedChannelIndex = pos
                recomputeFocusedProgram()
                onSelectFocused()
            }
        )
        binding.rvGuide.apply {
            layoutManager = LinearLayoutManager(this@EpgGuideActivity)
            adapter = guideAdapter
            itemAnimator = null
            setHasFixedSize(true)
            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrollStateChanged(rv: RecyclerView, newState: Int) {
                    if (newState == RecyclerView.SCROLL_STATE_IDLE) requestVisibleEpg()
                }
            })
        }
    }

    private fun setupCategories() {
        categoryAdapter = GuideCategoryAdapter(onSelect = { categoryId ->
            categoryAdapter.setSelected(categoryId)
            pendingInitialFocus = true
            scrollPx = 0f
            viewModel.selectCategory(categoryId)
        })
        binding.rvGuideCategories.apply {
            layoutManager = LinearLayoutManager(this@EpgGuideActivity, RecyclerView.HORIZONTAL, false)
            adapter = categoryAdapter
        }
    }

    private fun setupHeaderActions() {
        binding.btnPrevDay.setOnClickListener { changeDay(-1) }
        binding.btnNextDay.setOnClickListener { changeDay(1) }
        binding.btnJumpNow.setOnClickListener { jumpToNow() }
    }

    private fun changeDay(delta: Int) {
        val target = viewModel.selectedDayOffset() + delta
        if (target < 0) return
        scrollPx = 0f
        pendingInitialFocus = true
        viewModel.goToDay(target)
    }

    private fun jumpToNow() {
        if (viewModel.selectedDayOffset() != 0) {
            scrollPx = 0f
            viewModel.goToDay(0)
            return
        }
        focusTimeMs = System.currentTimeMillis().coerceIn(windowStartMs, windowEndMs - 1)
        recomputeFocusedProgram()
        currentFocusedProgram?.let { ensureVisible(it.startTime, it.endTime) }
            ?: ensureVisibleTime(focusTimeMs)
        pushGridState()
        updateDetails()
        focusRow(focusedChannelIndex)
    }

    private fun observeViewModel() {
        viewModel.categories.observe(this) { cats ->
            categoryAdapter.submit(
                cats,
                getString(R.string.all_categories),
                viewModel.selectedCategory.value
            )
        }
        viewModel.selectedCategory.observe(this) { id -> categoryAdapter.setSelected(id) }

        viewModel.state.observe(this) { st ->
            windowStartMs = st.windowStartMs
            windowEndMs = st.windowEndMs

            binding.guideLoading.visibility = if (st.loading && st.rows.isEmpty()) View.VISIBLE else View.GONE
            binding.guideEmpty.visibility = if (!st.loading && st.rows.isEmpty()) View.VISIBLE else View.GONE
            binding.tvDayLabel.text = dayLabel(st.dayOffset)
            binding.tvGuideChannelCount.text = getString(R.string.epg_channels_count, st.rows.size)

            guideAdapter.submitRows(st.rows)

            if (st.rows.isNotEmpty()) {
                if (pendingInitialFocus) {
                    pendingInitialFocus = false
                    focusedChannelIndex = 0
                    focusTimeMs = if (st.dayOffset == 0) {
                        System.currentTimeMillis().coerceIn(windowStartMs, windowEndMs - 1)
                    } else {
                        windowStartMs
                    }
                    recomputeFocusedProgram()
                    focusRow(0)
                } else {
                    focusedChannelIndex = focusedChannelIndex.coerceIn(0, st.rows.size - 1)
                    recomputeFocusedProgram()
                }
                requestVisibleEpg()
            }
            pushGridState()
            updateDetails()
        }
    }

    // ---- Cursor logic ----

    private fun onRowFocused(pos: Int) {
        focusedChannelIndex = pos
        recomputeFocusedProgram()
        pushGridState()
        updateDetails()
        requestVisibleEpg()
    }

    private fun moveCursorHorizontal(dir: Int) {
        val row = guideAdapter.rowAt(focusedChannelIndex) ?: return
        val anchor = currentFocusedProgram?.startTime ?: focusTimeMs
        focusTimeMs = if (dir > 0) {
            row.programs.firstOrNull { it.startTime > anchor }?.startTime ?: (focusTimeMs + STEP_MS)
        } else {
            row.programs.lastOrNull { it.startTime < anchor }?.startTime ?: (focusTimeMs - STEP_MS)
        }.coerceIn(windowStartMs, windowEndMs - 1)

        recomputeFocusedProgram()
        currentFocusedProgram?.let { ensureVisible(it.startTime, it.endTime) }
            ?: ensureVisibleTime(focusTimeMs)
        pushGridState()
        updateDetails()
    }

    /** On vertical navigation we keep the time the cursor points at and only highlight a
     *  program if one actually airs there, so changing channels never jumps the timeline. */
    private fun recomputeFocusedProgram() {
        val row = guideAdapter.rowAt(focusedChannelIndex)
        currentFocusedProgram = row?.programAt(focusTimeMs)
    }

    private fun onSelectFocused() {
        val row = guideAdapter.rowAt(focusedChannelIndex) ?: return
        val ch = row.channel
        val fp = currentFocusedProgram
        val now = System.currentTimeMillis()
        if (fp != null && fp.endTime <= now && ch.tvArchive) {
            openCatchUp(ch, fp)
        } else {
            tuneToChannel(ch.channelId)
        }
    }

    private fun tuneToChannel(channelId: String) {
        val intent = Intent(this, LiveTvActivity::class.java).apply {
            putExtra(LiveTvActivity.EXTRA_CHANNEL_ID, channelId)
            addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
        finish()
    }

    private fun openCatchUp(ch: com.mo.moplayer.data.local.entity.ChannelEntity, program: EpgEntity) {
        Toast.makeText(this, R.string.epg_catchup_open, Toast.LENGTH_SHORT).show()
        val intent = Intent(this, ArchiveActivity::class.java).apply {
            putExtra(ArchiveActivity.EXTRA_CHANNEL_ID, ch.channelId)
            putExtra(ArchiveActivity.EXTRA_CHANNEL_NAME, ch.name)
            putExtra(ArchiveActivity.EXTRA_CHANNEL_LOGO, ch.streamIcon)
            putExtra(ArchiveActivity.EXTRA_STREAM_ID, ch.streamId)
            putExtra(ArchiveActivity.EXTRA_ARCHIVE_DURATION, ch.tvArchiveDuration)
        }
        startActivity(intent)
    }

    // ---- Axis / scroll ----

    private fun buildAxis(): GuideTimeAxis =
        GuideTimeAxis(windowStartMs, windowEndMs, pxPerMinutePx, scrollPx)

    private fun pushGridState() {
        if (windowEndMs <= windowStartMs) return
        clampScroll()
        val axis = buildAxis()
        guideAdapter.applyState(axis, focusedChannelIndex, currentFocusedProgram?.startTime ?: Long.MIN_VALUE)
        binding.timeRuler.bind(axis)
    }

    private fun clampScroll() {
        val total = (windowEndMs - windowStartMs) / 60_000f * pxPerMinutePx
        val vp = viewportWidth()
        val max = (total - vp).coerceAtLeast(0f)
        scrollPx = scrollPx.coerceIn(0f, max)
    }

    private fun viewportWidth(): Float {
        if (viewportWidthPx <= 0f) viewportWidthPx = binding.timeRuler.width.toFloat()
        return viewportWidthPx
    }

    private fun ensureVisible(startMs: Long, endMs: Long) {
        val vp = viewportWidth()
        if (vp <= 0f) return
        val lead = vp * 0.16f
        val startX = (startMs - windowStartMs) / 60_000f * pxPerMinutePx - scrollPx
        if (startX < lead) {
            scrollPx -= (lead - startX)
        } else {
            val endX = (endMs - windowStartMs) / 60_000f * pxPerMinutePx - scrollPx
            if (endX > vp - lead) scrollPx += (endX - (vp - lead))
        }
        clampScroll()
    }

    private fun ensureVisibleTime(timeMs: Long) = ensureVisible(timeMs, timeMs + STEP_MS)

    // ---- Misc ----

    private fun updateDetails() {
        val ch = guideAdapter.rowAt(focusedChannelIndex)?.channel
        val fp = currentFocusedProgram
        if (fp == null) {
            binding.tvDetailTime.text = ""
            binding.tvDetailTitle.text = ch?.name ?: getString(R.string.epg_no_program)
            binding.tvDetailDescription.text = getString(R.string.epg_no_information)
        } else {
            binding.tvDetailTime.text = fp.getTimeRangeString()
            binding.tvDetailTitle.text = fp.title
            binding.tvDetailDescription.text = fp.description.orEmpty()
        }
        binding.tvDetailChannel.text = ch?.name ?: ""
    }

    private fun requestVisibleEpg() {
        val lm = binding.rvGuide.layoutManager as? LinearLayoutManager ?: return
        val first = lm.findFirstVisibleItemPosition()
        val last = lm.findLastVisibleItemPosition()
        if (first < 0 || last < 0) return
        val ids = (first..last).mapNotNull { guideAdapter.rowAt(it)?.channel?.streamId }
        if (ids.isNotEmpty()) viewModel.ensureEpgForChannels(ids)
    }

    private fun focusRow(index: Int) {
        binding.rvGuide.post {
            val lm = binding.rvGuide.layoutManager as? LinearLayoutManager ?: return@post
            lm.scrollToPositionWithOffset(index, 0)
            binding.rvGuide.post {
                binding.rvGuide.findViewHolderForAdapterPosition(index)?.itemView?.requestFocus()
            }
        }
    }

    private fun dayLabel(offset: Int): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, offset)
        val datePart = SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(cal.time)
        return if (offset == 0) "${getString(R.string.epg_today)} · $datePart" else datePart
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            if (event.keyCode == KeyEvent.KEYCODE_GUIDE) {
                finish()
                return true
            }
            if (binding.rvGuide.hasFocus()) {
                when (event.keyCode) {
                    KeyEvent.KEYCODE_DPAD_LEFT -> { moveCursorHorizontal(-1); return true }
                    KeyEvent.KEYCODE_DPAD_RIGHT -> { moveCursorHorizontal(1); return true }
                    KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_BUTTON_A -> {
                        onSelectFocused(); return true
                    }
                }
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onResume() {
        super.onResume()
        tickHandler.post(tickRunnable)
    }

    override fun onPause() {
        tickHandler.removeCallbacks(tickRunnable)
        super.onPause()
    }

    companion object {
        private const val STEP_MS = 30 * 60_000L
    }
}
