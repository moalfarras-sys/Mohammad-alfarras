package com.mo.moplayer.ui.livetv

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.ui.common.BaseThemedActivity
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.EpgEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.databinding.ActivityArchiveBinding
import com.mo.moplayer.databinding.ItemArchiveDateBinding
import com.mo.moplayer.databinding.ItemArchiveProgramBinding
import com.mo.moplayer.ui.player.PlayerActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@AndroidEntryPoint
class ArchiveActivity : BaseThemedActivity() {

    companion object {
        const val EXTRA_CHANNEL_ID = "channel_id"
        const val EXTRA_CHANNEL_NAME = "channel_name"
        const val EXTRA_CHANNEL_LOGO = "channel_logo"
        const val EXTRA_STREAM_ID = "stream_id"
        const val EXTRA_ARCHIVE_DURATION = "archive_duration"
    }

    private lateinit var binding: ActivityArchiveBinding

    @Inject
    lateinit var repository: IptvRepository

    private var channelId: String = ""
    private var channelName: String = ""
    private var channelLogo: String? = null
    private var streamId: Int = 0
    private var archiveDuration: Int = 7 // Days

    private lateinit var programAdapter: ArchiveProgramAdapter
    private var selectedDate: Calendar = Calendar.getInstance()
    private val availableDates = mutableListOf<Calendar>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityArchiveBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Get channel info from intent
        channelId = intent.getStringExtra(EXTRA_CHANNEL_ID) ?: ""
        channelName = intent.getStringExtra(EXTRA_CHANNEL_NAME) ?: ""
        channelLogo = intent.getStringExtra(EXTRA_CHANNEL_LOGO)
        streamId = intent.getIntExtra(EXTRA_STREAM_ID, 0)
        archiveDuration = intent.getIntExtra(EXTRA_ARCHIVE_DURATION, 7)

        setupUI()
        setupDateTabs()
        setupProgramList()
        loadPrograms()
        binding.epgTimeline.startAutoUpdate()
    }

    override fun getAnimatedBackground() = binding.animatedBackground

    private fun setupUI() {
        binding.tvChannelName.text = channelName
        binding.tvArchiveInfo.text = getString(R.string.archive_days_available, archiveDuration)

        if (!channelLogo.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this)) {
            Glide.with(this)
                .load(channelLogo)
                .placeholder(R.drawable.ic_placeholder_channel)
                .error(R.drawable.ic_placeholder_channel)
                .into(binding.ivChannelLogo)
        }

        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun setupDateTabs() {
        // Generate available dates (today and past days based on archive duration)
        availableDates.clear()
        for (i in 0 until archiveDuration) {
            val date = Calendar.getInstance()
            date.add(Calendar.DAY_OF_YEAR, -i)
            availableDates.add(date)
        }

        // Add date buttons programmatically
        binding.datesContainer.removeAllViews()
        availableDates.forEachIndexed { index, date ->
            val dateBinding = ItemArchiveDateBinding.inflate(layoutInflater, binding.datesContainer, false)
            
            val dayFormat = SimpleDateFormat("EEE", Locale.getDefault())
            val dayNumberFormat = SimpleDateFormat("d", Locale.getDefault())
            val monthFormat = SimpleDateFormat("MMM", Locale.getDefault())
            
            dateBinding.tvDayName.text = if (index == 0) getString(R.string.today) else dayFormat.format(date.time)
            dateBinding.tvDayNumber.text = dayNumberFormat.format(date.time)
            dateBinding.tvMonth.text = monthFormat.format(date.time)
            
            dateBinding.root.setOnClickListener {
                selectDate(index)
            }
            
            dateBinding.root.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    selectDate(index)
                }
            }
            
            binding.datesContainer.addView(dateBinding.root)
        }
        
        // Select today by default
        if (availableDates.isNotEmpty()) {
            selectedDate = availableDates[0]
            updateDateSelection(0)
        }
    }

    private fun selectDate(index: Int) {
        if (index in availableDates.indices) {
            selectedDate = availableDates[index]
            updateDateSelection(index)
            loadPrograms()
        }
    }

    private fun updateDateSelection(selectedIndex: Int) {
        for (i in 0 until binding.datesContainer.childCount) {
            val child = binding.datesContainer.getChildAt(i)
            child.isSelected = (i == selectedIndex)
        }
    }

    private fun setupProgramList() {
        programAdapter = ArchiveProgramAdapter { program ->
            playArchiveProgram(program)
        }

        binding.rvArchivePrograms.apply {
            layoutManager = LinearLayoutManager(this@ArchiveActivity)
            adapter = programAdapter
        }
    }

    private fun loadPrograms() {
        binding.loadingOverlay.visibility = View.VISIBLE
        binding.emptyState.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val server = repository.getActiveServerSync()
                if (server != null) {
                    // Get start and end of selected day
                    val dayStart = selectedDate.clone() as Calendar
                    dayStart.set(Calendar.HOUR_OF_DAY, 0)
                    dayStart.set(Calendar.MINUTE, 0)
                    dayStart.set(Calendar.SECOND, 0)
                    dayStart.set(Calendar.MILLISECOND, 0)

                    val dayEnd = dayStart.clone() as Calendar
                    dayEnd.add(Calendar.DAY_OF_YEAR, 1)

                    val programs = repository.getEpgForDay(
                        streamId,
                        server.id,
                        dayStart.timeInMillis,
                        dayEnd.timeInMillis
                    )

                    binding.loadingOverlay.visibility = View.GONE

                    if (programs.isEmpty()) {
                        binding.emptyState.visibility = View.VISIBLE
                        programAdapter.submitList(emptyList())
                    } else {
                        binding.emptyState.visibility = View.GONE
                        programAdapter.submitList(programs)
                    }
                } else {
                    binding.loadingOverlay.visibility = View.GONE
                    binding.emptyState.visibility = View.VISIBLE
                    Toast.makeText(this@ArchiveActivity, getString(R.string.error_no_server), Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                binding.loadingOverlay.visibility = View.GONE
                binding.emptyState.visibility = View.VISIBLE
                Toast.makeText(this@ArchiveActivity, getString(R.string.error_loading_archive), Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun playArchiveProgram(program: EpgEntity) {
        lifecycleScope.launch {
            val server = repository.getActiveServerSync()
            if (server != null) {
                // Calculate duration in minutes
                val durationMs = program.endTime - program.startTime
                val durationMinutes = (durationMs / 1000 / 60).toInt()
                val startTimestamp = program.startTime / 1000 // Convert to seconds

                // Build archive URL
                val archiveUrl = repository.buildArchiveUrl(server, streamId, startTimestamp, durationMinutes)

                val intent = Intent(this@ArchiveActivity, PlayerActivity::class.java).apply {
                    putExtra(PlayerActivity.EXTRA_STREAM_URL, archiveUrl)
                    putExtra(PlayerActivity.EXTRA_TITLE, program.title)
                    putExtra(PlayerActivity.EXTRA_TYPE, "ARCHIVE")
                    putExtra(PlayerActivity.EXTRA_CONTENT_ID, program.id)
                }
                startActivity(intent)
            } else {
                Toast.makeText(this@ArchiveActivity, getString(R.string.error_no_server), Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (maybeHandleExitOnBack()) return true
            finish()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        binding.epgTimeline.startAutoUpdate()
    }

    override fun onPause() {
        super.onPause()
        binding.epgTimeline.stopAutoUpdate()
    }

    // Archive Program Adapter
    private inner class ArchiveProgramAdapter(
        private val onProgramClick: (EpgEntity) -> Unit
    ) : ListAdapter<EpgEntity, ArchiveProgramAdapter.ProgramViewHolder>(EpgDiffCallback()) {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProgramViewHolder {
            val binding = ItemArchiveProgramBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            return ProgramViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ProgramViewHolder, position: Int) {
            holder.bind(getItem(position))
        }

        inner class ProgramViewHolder(
            private val binding: ItemArchiveProgramBinding
        ) : RecyclerView.ViewHolder(binding.root) {

            fun bind(program: EpgEntity) {
                binding.tvStartTime.text = program.getStartTimeFormatted()
                
                val endFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                binding.tvEndTime.text = "- ${endFormat.format(Date(program.endTime))}"
                
                binding.tvProgramTitle.text = program.title
                binding.tvProgramDescription.text = program.description ?: ""
                
                // Calculate duration
                val durationMinutes = (program.endTime - program.startTime) / 1000 / 60
                binding.tvDuration.text = getString(R.string.duration_minutes, durationMinutes)

                binding.programContainer.setOnClickListener {
                    onProgramClick(program)
                }
            }
        }
    }
}

// DiffCallback for EPG items - must be outside inner class
private class EpgDiffCallback : DiffUtil.ItemCallback<EpgEntity>() {
    override fun areItemsTheSame(oldItem: EpgEntity, newItem: EpgEntity): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: EpgEntity, newItem: EpgEntity): Boolean {
        return oldItem == newItem
    }
}
